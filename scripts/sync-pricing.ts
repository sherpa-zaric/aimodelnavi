#!/usr/bin/env tsx

/**
 * sync-pricing.ts
 *
 * Fetches API pricing pages from major providers and uses Claude API to
 * extract structured pricing data. Self-healing: retries with different
 * strategies if extraction fails.
 *
 * Providers covered:
 *   - OpenAI (https://openai.com/api/pricing/)
 *   - Anthropic
 *   - Google DeepMind
 *   - DeepSeek
 *   - xAI
 *
 * Output: src/data/pricing.ts
 *
 * Usage: npx tsx scripts/sync-pricing.ts
 */

import { extractFromHTML, validateData } from "./lib/anthropic";
import { saveDataFile, readDataFile, diffSnapshots } from "./lib/storage";

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

async function fetchPageHTTP(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AIModelNavi/1.0",
      "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.text();
}

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
  // Wait for pricing content to render
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
  return fetchPageHTTP(url);
}
}

async function extractWithRetry(
  html: string,
  providerName: string
): Promise<PricingEntry[]> {
  // Strategy 1: Try extracting from full HTML
  try {
    console.log(`    Strategy 1: Full HTML extraction`);
    const data = await extractFromHTML<PricingEntry[]>(
      html,
      "Array<PricingEntry>",
      `Provider: ${providerName}\n${SCHEMA_INSTRUCTIONS}`
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 1 failed: ${err}`);
  }

  // Strategy 2: Strip scripts/styles, try with cleaned HTML
  try {
    console.log(`    Strategy 2: Cleaned HTML extraction`);
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50000); // Limit to 50K chars to avoid token limits

    const data = await extractFromHTML<PricingEntry[]>(
      cleaned,
      "Array<PricingEntry>",
      `Provider: ${providerName}\n${SCHEMA_INSTRUCTIONS}\nNote: This is cleaned HTML, focus on main content area.`
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 2 failed: ${err}`);
  }

  // Strategy 3: Try different prompt approach
  try {
    console.log(`    Strategy 3: Alternative prompt`);
    const simplePrompt = `The following HTML is from ${providerName}'s pricing page. Extract all model names and their prices per 1M tokens as JSON array. Format: [{"modelName": "...", "inputPrice": number, "outputPrice": number, "billingMode": "standard"}]`;
    const data = await extractFromHTML<PricingEntry[]>(
      html.slice(0, 30000),
      "Array<PricingEntry>",
      simplePrompt
    );
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn(`    Strategy 3 failed: ${err}`);
  }

  return [];
}

function generateOutputFile(entries: PricingEntry[]): string {
  const data = JSON.stringify(entries, null, 2);

  return `// Auto-generated by sync-pricing.ts
// Last updated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

export type BillingMode = "standard" | "batch" | "cache" | "long-context";

export interface PricingEntry {
  modelName: string;
  provider: string;
  billingMode: BillingMode;
  inputPrice: number;
  outputPrice: number;
  inputModality: "text" | "multimodal";
  outputModality: "text" | "multimodal";
  releaseDate: string;
  notes?: string;
}

export const pricingData: PricingEntry[] = ${data};
`;
}

async function main() {
  console.log("=== API料金データ同期開始 ===\n");

  const allEntries: PricingEntry[] = [];
  const failures: string[] = [];

  for (const provider of PROVIDERS) {
    console.log(`[${provider.name}] ${provider.url}`);

    try {
      const html = await fetchPage(provider.url, provider.needsJS);
      console.log(`  Fetched ${(html.length / 1024).toFixed(0)}KB`);

      const entries = await extractWithRetry(html, provider.name);

      if (entries.length === 0) {
        console.warn(`  ⚠️  No pricing data extracted for ${provider.name}`);
        failures.push(provider.name);
        continue;
      }

      console.log(`  ✓ Extracted ${entries.length} pricing entries`);

      // Validate extracted data
      const validation = await validateData(
        entries,
        `${provider.name} API pricing`
      );
      if (!validation.valid) {
        console.warn(`  ⚠️  Validation issues:`);
        validation.issues.forEach((i) => console.warn(`     - ${i}`));
      }

      allEntries.push(...entries);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
      failures.push(provider.name);
    }
  }

  console.log(
    `\n---\n  Total: ${allEntries.length} pricing entries from ${PROVIDERS.length - failures.length}/${PROVIDERS.length} providers`
  );

  if (failures.length > 0) {
    console.warn(`  Failed providers: ${failures.join(", ")}`);
  }

  // Detect changes from previous run
  const oldContent = readDataFile("pricing.ts");
  const output = generateOutputFile(allEntries);

  if (oldContent) {
    // Extract old entries for comparison
    const oldEntriesMatch = oldContent.match(/export const pricingData: PricingEntry\[\] = (\[[\s\S]*?\]);/);
    if (oldEntriesMatch) {
      try {
        const oldEntries = JSON.parse(oldEntriesMatch[1]) as PricingEntry[];
        const diff = diffSnapshots(oldEntries as Record<string, unknown>[], allEntries as Record<string, unknown>[], "modelName");
        if (diff.added > 0 || diff.removed > 0 || diff.changed.length > 0) {
          console.log(`\n  Changes detected:`);
          if (diff.added > 0) console.log(`    +${diff.added} new entries`);
          if (diff.removed > 0) console.log(`    -${diff.removed} removed entries`);
          if (diff.changed.length > 0)
            console.log(`    ~${diff.changed.length} changed: ${diff.changed.join(", ")}`);
        } else {
          console.log("\n  ✓ No changes detected.");
        }
      } catch {
        // JSON parsing failed, proceed with save
      }
    }
  }

  // Save
  saveDataFile("pricing.ts", output);

  console.log("\n=== 同期完了 ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
