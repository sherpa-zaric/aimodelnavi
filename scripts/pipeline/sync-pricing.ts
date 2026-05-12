#!/usr/bin/env tsx

/**
 * sync-pricing.ts (Pipeline version)
 *
 * Fetches API pricing pages from major providers and stores in SQLite.
 * Uses LLM to extract structured pricing data with retry strategies.
 *
 * Providers covered:
 *   - OpenAI
 *   - Anthropic
 *   - Google DeepMind
 *   - DeepSeek
 *   - xAI
 *
 * Stores results in pricing_entries table.
 *
 * Usage: npx tsx scripts/pipeline/sync-pricing.ts
 */

import { extractFromHTML, validateData } from "../lib/anthropic";
import { getDb, migrate, getSourceId, startCrawlLog, endCrawlLog } from "../lib/db";
import { rateLimitedFetch } from "../lib/http";

interface PricingEntry {
  modelName: string;
  provider: string;
  billingMode: "standard" | "batch" | "cache" | "long-context";
  inputPrice: number;
  outputPrice: number;
  inputModality: "text" | "multimodal";
  outputModality: "text" | "multimodal";
  releaseDate: string;
  notes?: string;
}

const SCHEMA_INSTRUCTIONS = `Extract AI model API pricing information from this page.
For EACH pricing tier/row, extract:
- modelName: exact model name (e.g. "GPT-5.2", "Claude Opus 4.7")
- provider: company name (OpenAI, Anthropic, Google DeepMind, DeepSeek-AI, xAI, Alibaba, Zhipu AI)
- billingMode: "standard" | "batch" | "cache" | "long-context" (determine from context)
- inputPrice: USD price per 1 MILLION input tokens (as number, e.g. 1.25 NOT 1.25M)
- outputPrice: USD price per 1 MILLION output tokens (as number)
- inputModality: "text" | "multimodal" (multimodal if it supports images/audio)
- outputModality: "text" | "multimodal"
- releaseDate: approximate in YYYY-MM-DD (use today's date minus a reasonable estimate)
- notes: any special conditions or notes in Japanese

IMPORTANT: Prices must be per 1 MILLION tokens. If the page shows per-1K-token prices, multiply by 1000.
If the page shows per-token prices, multiply by 1,000,000.`;

const PROVIDERS = [
  {
    name: "OpenAI",
    url: "https://openai.com/api/pricing/",
    needsJS: true,
  },
  {
    name: "Anthropic",
    url: "https://www.anthropic.com/pricing",
    needsJS: true,
  },
  {
    name: "Google DeepMind",
    url: "https://ai.google.dev/pricing",
    needsJS: false,
  },
  {
    name: "DeepSeek-AI",
    url: "https://api-docs.deepseek.com/quick_start/pricing",
    needsJS: false,
  },
  {
    name: "xAI",
    url: "https://x.ai/api-pricing",
    needsJS: true,
  },
];

async function fetchPagePlaywright(url: string): Promise<string> {
  let playwright: any;
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error("Playwright not installed. Run: npx playwright install chromium");
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  const html = await page.content();
  await browser.close();
  return html;
}

async function fetchPage(url: string, needsJS: boolean): Promise<string> {
  if (needsJS) {
    console.log("    Using Playwright (JS rendering required)");
    return fetchPagePlaywright(url);
  }
  console.log("    Using HTTP fetch");
  const res = await rateLimitedFetch(url);
  return res.body;
}

function preprocessHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractWithRetry(
  html: string,
  providerName: string
): Promise<PricingEntry[]> {
  const preprocessed = preprocessHTML(html);

  // Strategy 1: Full preprocessed HTML
  try {
    console.log(`    Strategy 1: Preprocessed HTML (30K)`);
    const data = await extractFromHTML<PricingEntry[]>(
      preprocessed.slice(0, 30000),
      "Array<PricingEntry>",
      `Provider: ${providerName}\n${SCHEMA_INSTRUCTIONS}\nNote: HTML has been preprocessed. Focus on pricing tables and lists.`
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 1 failed: ${err}`);
  }

  // Strategy 2: Shorter excerpt
  try {
    console.log(`    Strategy 2: Short HTML (15K)`);
    const data = await extractFromHTML<PricingEntry[]>(
      preprocessed.slice(0, 15000),
      "Array<PricingEntry>",
      `Provider: ${providerName}\n${SCHEMA_INSTRUCTIONS}\nNote: This is a short excerpt from the pricing page. Extract whatever pricing data you can find.`
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 2 failed: ${err}`);
  }

  // Strategy 3: Minimal prompt
  try {
    console.log(`    Strategy 3: Minimal prompt (8K)`);
    const data = await extractFromHTML<PricingEntry[]>(
      preprocessed.slice(0, 8000),
      "Array<PricingEntry>",
      `Extract pricing from this ${providerName} page snippet. Return JSON array: [{"modelName":"...", "inputPrice":0, "outputPrice":0, "billingMode":"standard"}]`
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 3 failed: ${err}`);
  }

  return [];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function storePricingEntries(entries: PricingEntry[], sourceUrl: string): number {
  const db = getDb();
  let stored = 0;

  const upsert = db.prepare(
    `INSERT INTO pricing_entries (model_id, model_name, provider, billing_mode, input_price, output_price, input_modality, output_modality, notes, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(model_name, provider, billing_mode) DO UPDATE SET
       input_price = excluded.input_price,
       output_price = excluded.output_price,
       input_modality = excluded.input_modality,
       output_modality = excluded.output_modality,
       notes = excluded.notes,
       source_url = excluded.source_url,
       updated_at = datetime('now')`
  );

  for (const entry of entries) {
    // Try to find matching model in models table
    const slug = slugify(entry.modelName);
    let modelId: number | null = null;

    const existing = db.prepare("SELECT id FROM models WHERE slug = ?").get(slug) as { id: number } | undefined;
    if (existing) {
      modelId = existing.id;
    } else {
      // Fuzzy match by name
      const fuzzy = db.prepare("SELECT id FROM models WHERE name LIKE ? LIMIT 1").get(`%${entry.modelName}%`) as { id: number } | undefined;
      if (fuzzy) modelId = fuzzy.id;
    }

    upsert.run(
      modelId,
      entry.modelName,
      entry.provider,
      entry.billingMode,
      entry.inputPrice,
      entry.outputPrice,
      entry.inputModality,
      entry.outputModality,
      entry.notes || null,
      sourceUrl
    );
    stored++;
  }

  return stored;
}

export async function syncPricing(): Promise<{
  totalEntries: number;
  providerResults: { name: string; entries: number; success: boolean }[];
  failures: string[];
}> {
  migrate();

  const sourceId = getSourceId("pricing");
  const allEntries: PricingEntry[] = [];
  const failures: string[] = [];
  const providerResults: { name: string; entries: number; success: boolean }[] = [];

  for (const provider of PROVIDERS) {
    console.log(`[${provider.name}] ${provider.url}`);

    try {
      const logId = startCrawlLog(sourceId, provider.url, "incremental");
      const html = await fetchPage(provider.url, provider.needsJS);
      console.log(`  Fetched ${(html.length / 1024).toFixed(0)}KB`);
      endCrawlLog(logId, 200, null, null);

      const entries = await extractWithRetry(html, provider.name);

      if (entries.length === 0) {
        console.warn(`  ⚠️  No pricing data extracted for ${provider.name}`);
        failures.push(provider.name);
        providerResults.push({ name: provider.name, entries: 0, success: false });
        continue;
      }

      console.log(`  ✓ Extracted ${entries.length} pricing entries`);

      const validation = await validateData(entries, `${provider.name} API pricing`);
      if (!validation.valid) {
        console.warn(`  ⚠️  Validation issues:`);
        validation.issues.forEach((i) => console.warn(`     - ${i}`));
      }

      const stored = storePricingEntries(entries, provider.url);
      console.log(`  ✓ Stored ${stored} entries in DB`);

      allEntries.push(...entries);
      providerResults.push({ name: provider.name, entries: entries.length, success: true });
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
      failures.push(provider.name);
      providerResults.push({ name: provider.name, entries: 0, success: false });
    }
  }

  console.log(`\n  Pricing sync: ${allEntries.length} entries from ${PROVIDERS.length - failures.length}/${PROVIDERS.length} providers`);
  if (failures.length > 0) {
    console.warn(`  Failed: ${failures.join(", ")}`);
  }

  return {
    totalEntries: allEntries.length,
    providerResults,
    failures,
  };
}

// Allow direct execution
if (process.argv[1]?.endsWith("sync-pricing.ts")) {
  syncPricing()
    .then((r) => console.log(`Done: ${r.totalEntries} pricing entries`))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}