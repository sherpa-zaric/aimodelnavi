#!/usr/bin/env tsx

/**
 * sync-datalearner.ts
 *
 * Syncs AI model data from DataLearnerAI (datalearner.com).
 * Uses JSON-LD structured data for reliable extraction, then LLM for
 * Chinese-to-Japanese translation.
 *
 * Strategy:
 *   1. Parse JSON-LD from model list pages to get model slugs
 *   2. Fetch detail pages for trending/top models, extract SoftwareApplication JSON-LD
 *   3. Use LLM to translate Chinese descriptions to Japanese
 *   4. Merge with existing curated data (Japanese domestic models, etc.)
 *   5. Save as structured TypeScript data files
 *
 * Usage: LLM_API_KEY=xxx npx tsx scripts/sync-datalearner.ts
 */

import { translateToJapanese } from "./lib/anthropic";
import { saveDataFile, readDataFile } from "./lib/storage";

const BASE_URL = "https://www.datalearner.com";
const MODELS_URL = `${BASE_URL}/ai-models/pretrained-models`;

const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "ollama";
const LLM_MODEL = process.env.LLM_MODEL || "gemma4:31b";

const MAX_DETAIL_PAGES = 60;
const REQUEST_DELAY_MS = 800;

interface DLModel {
  slug: string;
  name: string;
  alternateName?: string;
  developer: string;
  developerLogoUrl?: string;
  descriptionZh: string;
  descriptionJa?: string;
  releaseDate: string;
  licenseStatus: "open" | "closed" | "open-nc";
  licenseRaw?: string;
  category: string;
  parameterCount?: string;
  contextWindow?: string;
  pricing?: {
    inputPer1M?: number;
    outputPer1M?: number;
    currency: string;
    rawPrice?: string;
  };
  sameAs: string[];
  datalearnerUrl: string;
}

// ── HTML Fetching ──

async function fetchPage(url: string): Promise<string> {
  console.log(`  Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AIModelsNavi/1.0",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  return res.text();
}

// ── JSON-LD Extraction ──

interface ListItem {
  position: number;
  name: string;
  url: string;
  description?: string;
}

interface SoftwareApp {
  name: string;
  alternateName?: string;
  description: string;
  author?: { name: string; logo?: string };
  datePublished?: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
    category?: string;
  };
  license?: string;
  sameAs?: string[];
}

function extractJsonLd(html: string): any[] {
  const blocks = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  ) || [];

  return blocks
    .map((block) => {
      const jsonStr = block
        .replace(/<script type="application\/ld\+json">/, "")
        .replace(/<\/script>/, "");
      try {
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function extractModelSlugsFromPage(html: string): string[] {
  const links = html.match(
    /href="\/ai-models\/pretrained-models\/([^"]+)"/g
  ) || [];
  const slugs = [
    ...new Set(
      links.map((l) =>
        l.replace('href="/ai-models/pretrained-models/', "").replace('"', "")
      )
    ),
  ];
  return slugs;
}

function extractItemListData(html: string): {
  allModels: ListItem[];
  trending: ListItem[];
  hot: ListItem[];
  featured: ListItem[];
  openSource: ListItem[];
} {
  const ldData = extractJsonLd(html);
  const result = {
    allModels: [] as ListItem[],
    trending: [] as ListItem[],
    hot: [] as ListItem[],
    featured: [] as ListItem[],
    openSource: [] as ListItem[],
  };

  for (const item of ldData) {
    if (item["@type"] !== "ItemList") continue;
    const name: string = item.name || "";
    const elements: ListItem[] = (item.itemListElement || []).map(
      (el: any, idx: number) => ({
        position: el.position || idx + 1,
        name: el.name || "",
        url: el.url || "",
        description: el.description || undefined,
      })
    );

    if (name.includes("追踪中心") || name.includes("AI大模型列表")) {
      result.allModels = elements;
    } else if (name.includes("趋势") || name.includes("Trending")) {
      result.trending = elements;
    } else if (name.includes("热门") || name.includes("Hot")) {
      result.hot = elements;
    } else if (name.includes("特色") || name.includes("Featured")) {
      result.featured = elements;
    } else if (name.includes("开源") || name.includes("Open Source")) {
      result.openSource = elements;
    }
  }

  return result;
}

function parseSoftwareApp(html: string): SoftwareApp | null {
  const ldData = extractJsonLd(html);
  for (const item of ldData) {
    if (item["@type"] === "SoftwareApplication") {
      return item as SoftwareApp;
    }
  }
  return null;
}

// ── Category Inference ──

function inferCategory(name: string, description: string): string {
  const lower = (name + " " + description).toLowerCase();
  if (lower.match(/codex|coder|code/i)) return "coder";
  if (lower.match(/reasoning|think|deep.?think|o[0-9]|mythos/i)) return "reasoning";
  if (lower.match(/embed|embed$/i)) return "embedding";
  if (lower.match(/image|vision|multimodal|vl-|ocr/i)) return "multimodal";
  if (lower.match(/voice|tts|asr|speech|audio/i)) return "voice";
  return "foundation";
}

function inferLicenseStatus(licenseStr?: string): "open" | "closed" | "open-nc" {
  if (!licenseStr) return "closed";
  const lower = licenseStr.toLowerCase();
  if (lower.includes("不开源") || lower.includes("proprietary") || lower.includes("プロプライエタリ")) return "closed";
  if (lower.includes("mit") || lower.includes("apache") || lower.includes("open source")) return "open";
  if (lower.includes("nc") || lower.includes("非商用") || lower.includes("non-commercial")) return "open-nc";
  if (lower.includes("llama") || lower.includes("gemma")) return "open-nc";
  return "closed";
}

// ── Main Pipeline ──

async function scrapeModelList(): Promise<{
  models: DLModel[];
  slugs: string[];
}> {
  console.log("\n[1] Scraping DataLearnerAI model list...");

  const allSlugs: string[] = [];
  const trendingModels: ListItem[] = [];
  const hotModels: ListItem[] = [];

  // Scrape first 5 pages to get model slugs
  for (let page = 1; page <= 5; page++) {
    const url = page === 1 ? MODELS_URL : `${MODELS_URL}?page=${page}`;
    console.log(`  Page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      const slugs = extractModelSlugsFromPage(html);
      allSlugs.push(...slugs);

      // On page 1, also extract structured list data
      if (page === 1) {
        const listData = extractItemListData(html);
        trendingModels.push(...listData.trending);
        hotModels.push(...listData.hot);
        console.log(`  → Trending: ${listData.trending.length}, Hot: ${listData.hot.length}`);
      }

      console.log(`  → Found ${slugs.length} slugs on page ${page}`);

      if (page < 5) {
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (err) {
      console.warn(`  Page ${page} failed: ${err}`);
    }
  }

  // Deduplicate slugs
  const uniqueSlugs = [...new Set(allSlugs)];
  console.log(`  Total unique slugs: ${uniqueSlugs.length}`);

  // Determine which models to fetch detail pages for
  // Priority: trending + hot + featured models, then fill from slug list
  const prioritySlugs = new Set([
    ...trendingModels.map((m) => m.url.split("/").pop()!),
    ...hotModels.map((m) => m.url.split("/").pop()!),
  ]);

  const slugsToFetch = [
    ...prioritySlugs,
    ...uniqueSlugs.filter((s) => !prioritySlugs.has(s)),
  ].slice(0, MAX_DETAIL_PAGES);

  console.log(`  Fetching detail pages for ${slugsToFetch.length} models...`);

  const models: DLModel[] = [];

  for (let i = 0; i < slugsToFetch.length; i++) {
    const slug = slugsToFetch[i];
    const url = `${BASE_URL}/ai-models/pretrained-models/${slug}`;

    try {
      const html = await fetchPage(url);
      const app = parseSoftwareApp(html);

      if (!app) {
        console.warn(`  ${i + 1}/${slugsToFetch.length} ${slug}: no JSON-LD data`);
        continue;
      }

      const model: DLModel = {
        slug,
        name: app.name || slug,
        alternateName: app.alternateName,
        developer: app.author?.name || "Unknown",
        developerLogoUrl: app.author?.logo,
        descriptionZh: (app.description || "").slice(0, 500),
        releaseDate: app.datePublished || "",
        licenseStatus: inferLicenseStatus(app.license),
        licenseRaw: app.license,
        category: inferCategory(app.name || "", app.description || ""),
        sameAs: app.sameAs || [],
        datalearnerUrl: url,
        pricing: app.offers
          ? {
              rawPrice: app.offers.price,
              currency: app.offers.priceCurrency || "USD",
            }
          : undefined,
      };

      models.push(model);
      console.log(`  ${i + 1}/${slugsToFetch.length} ${model.name} (${model.developer})`);

      if (i < slugsToFetch.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (err) {
      console.warn(`  ${i + 1}/${slugsToFetch.length} ${slug}: failed - ${err}`);
    }
  }

  return { models, slugs: uniqueSlugs };
}

async function translateDescriptions(models: DLModel[]): Promise<DLModel[]> {
  console.log("\n[2] Translating model descriptions to Japanese...");

  if (!LLM_API_KEY) {
    console.warn("  No LLM_API_KEY set, skipping translation");
    return models.map((m) => ({
      ...m,
      descriptionJa: `[翻訳未対応] ${m.developer}の${m.category}モデル。`,
    }));
  }

  const batchSize = 15;
  const translated: DLModel[] = [];

  for (let i = 0; i < models.length; i += batchSize) {
    const batch = models.slice(i, i + batchSize);
    console.log(
      `  Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(models.length / batchSize)}...`
    );

    try {
      const descriptionsZh = batch
        .map((m) => `## ${m.name} (${m.developer})\n${m.descriptionZh}`)
        .join("\n\n");

      const result = await translateToJapanese(
        descriptionsZh,
        "AI model descriptions from DataLearnerAI (Chinese). Translate each model description to natural Japanese. Keep model names and developer names in English. Use Japanese AI terminology: 推論モデル, 基盤モデル, マルチモーダル, etc."
      );

      // Split by model name headers
      const sections = result.split(/^## /m).filter(Boolean);

      for (let j = 0; j < batch.length; j++) {
        const section = sections[j] || "";
        // Extract description after the header line
        const lines = section.split("\n").filter((l: string) => l.trim());
        const descJa = lines.length > 1
          ? lines.slice(1).join(" ").trim()
          : lines[0]?.trim() || `${batch[j].developer}の${batch[j].category}モデル。`;

        translated.push({
          ...batch[j],
          descriptionJa: descJa,
        });
      }
    } catch (err) {
      console.warn(`  Translation batch failed: ${err}`);
      translated.push(
        ...batch.map((m) => ({
          ...m,
          descriptionJa: `${m.developer}の${m.category}モデル。`,
        }))
      );
    }

    if (i + batchSize < models.length) {
      await sleep(500);
    }
  }

  return translated;
}

function generateModelData(models: DLModel[]): string {
  // Merge with existing curated data
  const existingContent = readDataFile("models.ts");
  const existingSlugs = existingContent
    ? (existingContent.match(/slug:\s*"([^"]+)"/g) || []).map((s: string) =>
        s.replace('slug: "', "").replace('"', "")
      )
    : [];

  // Separate synced vs curated models
  const syncedModels = models.filter(
    (m) => !existingSlugs.includes(m.slug)
  );

  const data = JSON.stringify(syncedModels, null, 2);

  return `// Auto-generated by sync-datalearner.ts
// Last updated: ${new Date().toISOString()}
// Source: DataLearnerAI (datalearner.com) + manual curation
// DO NOT EDIT MANUALLY (except for Japanese domestic models section)

export interface ModelListItem {
  slug: string;
  name: string;
  developer: string;
  descriptionJa: string;
  releaseDate: string;
  licenseStatus: "open" | "closed" | "open-nc";
  category: string;
  datalearnerUrl: string;
  sameAs: string[];
}

export const syncedModels: ModelListItem[] = ${data};
`;
}

function generateSlugList(slugs: string[]): string {
  return `// Auto-generated by sync-datalearner.ts
// Last updated: ${new Date().toISOString()}
// Full list of model slugs from DataLearnerAI

export const allModelSlugs: string[] = ${JSON.stringify(slugs, null, 2)};
`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──

async function main() {
  console.log("=== DataLearnerAI データ同期開始 ===\n");
  console.log(`  Provider: ${LLM_PROVIDER}`);
  console.log(`  Model: ${LLM_MODEL}\n`);

  // Step 1: Scrape model list + detail pages
  const { models, slugs } = await scrapeModelList();

  if (models.length === 0) {
    console.log("No models found. Exiting.");
    return;
  }

  console.log(`\n  Scraped ${models.length} models with detail data`);
  console.log(`  Total ${slugs.length} model slugs discovered`);

  // Step 2: Translate descriptions
  const translated = await translateDescriptions(models);

  // Step 3: Generate data files
  const modelListOutput = generateModelData(translated);
  saveDataFile("model-list.ts", modelListOutput);

  const slugListOutput = generateSlugList(slugs);
  saveDataFile("model-slugs.ts", slugListOutput);

  console.log(`\n=== 同期完了 (${translated.length} models, ${slugs.length} slugs) ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});