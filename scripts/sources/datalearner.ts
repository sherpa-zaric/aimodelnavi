/**
 * DataLearnerAI (datalearner.com) crawler source.
 * Uses JSON-LD structured data for reliable model extraction.
 */

import {
  getDb,
  migrate,
  getSourceId,
  startCrawlLog,
  endCrawlLog,
  upsertRawModel,
  getExistingExternalIds,
  contentHash,
} from "../lib/db";
import { rateLimitedFetch } from "../lib/http";

const BASE_URL = "https://www.datalearner.com";
const MODELS_URL = `${BASE_URL}/ai-models/pretrained-models`;

// ── JSON-LD Extraction ──

interface SoftwareApp {
  name: string;
  alternateName?: string;
  description: string;
  author?: { name: string; logo?: string };
  datePublished?: string;
  offers?: { price?: string; priceCurrency?: string; category?: string; url?: string };
  license?: string;
  sameAs?: string[];
}

function extractJsonLd(html: string): any[] {
  const blocks =
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
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

function extractSoftwareApp(html: string): SoftwareApp | null {
  const ldData = extractJsonLd(html);
  for (const item of ldData) {
    if (item["@type"] === "SoftwareApplication") {
      return item as SoftwareApp;
    }
  }
  return null;
}

function extractModelSlugsFromPage(html: string): string[] {
  const links =
    html.match(/href="\/ai-models\/pretrained-models\/([^"]+)"/g) || [];
  return [
    ...new Set(
      links.map((l) =>
        l
          .replace('href="/ai-models/pretrained-models/', "")
          .replace('"', "")
      )
    ),
  ];
}

// ── Main Crawl Function ──

export interface CrawlResult {
  totalSlugs: number;
  newSlugs: number;
  detailPagesFetched: number;
  modelsStored: number;
  errors: string[];
}

export async function crawlDataLearner(
  mode: "full" | "incremental"
): Promise<CrawlResult> {
  migrate();
  const db = getDb();
  const sourceId = getSourceId("datalearner");

  const result: CrawlResult = {
    totalSlugs: 0,
    newSlugs: 0,
    detailPagesFetched: 0,
    modelsStored: 0,
    errors: [],
  };

  // Determine how many list pages to scrape
  const maxListPages = mode === "full" ? 5 : 1;
  const allSlugs: string[] = [];

  console.log(`\n[DataLearnerAI] Crawling model list (${mode} mode, ${maxListPages} pages)...`);

  for (let page = 1; page <= maxListPages; page++) {
    const url = page === 1 ? MODELS_URL : `${MODELS_URL}?page=${page}`;
    const logId = startCrawlLog(sourceId, url, mode);

    try {
      const { body, status } = await rateLimitedFetch(url);
      const slugs = extractModelSlugsFromPage(body);
      allSlugs.push(...slugs);
      endCrawlLog(logId, status, contentHash(body.slice(0, 5000)), null);
      console.log(`  Page ${page}: ${slugs.length} slugs`);
    } catch (err) {
      endCrawlLog(logId, 0, null, String(err));
      result.errors.push(`Page ${page}: ${err}`);
      console.warn(`  Page ${page} failed: ${err}`);
    }
  }

  const uniqueSlugs = [...new Set(allSlugs)];
  result.totalSlugs = uniqueSlugs.length;

  // Find new slugs not in database
  const existingIds = getExistingExternalIds(sourceId);
  const newSlugs = uniqueSlugs.filter((s) => !existingIds.has(s));
  result.newSlugs = newSlugs.length;

  // In full mode, also re-check existing slugs for updates
  const slugsToFetch =
    mode === "full"
      ? uniqueSlugs
      : newSlugs;

  console.log(
    `  Total: ${uniqueSlugs.length} slugs, ${newSlugs.length} new, fetching ${slugsToFetch.length} detail pages...`
  );

  // Fetch detail pages
  for (let i = 0; i < slugsToFetch.length; i++) {
    const slug = slugsToFetch[i];
    const url = `${BASE_URL}/ai-models/pretrained-models/${slug}`;
    const logId = startCrawlLog(sourceId, url, mode);

    try {
      const { body, status } = await rateLimitedFetch(url);
      const app = extractSoftwareApp(body);

      if (app) {
        const { changed } = upsertRawModel({
          sourceId,
          externalId: slug,
          sourceUrl: url,
          rawData: app as unknown as Record<string, unknown>,
        });

        if (changed) result.modelsStored++;
        result.detailPagesFetched++;
        console.log(
          `  ${i + 1}/${slugsToFetch.length} ${app.name} (${app.author?.name || "Unknown"})${changed ? " [NEW/CHANGED]" : ""}`
        );
      } else {
        console.warn(`  ${i + 1}/${slugsToFetch.length} ${slug}: no JSON-LD data`);
      }

      endCrawlLog(logId, status, contentHash(body.slice(0, 5000)), null);
    } catch (err) {
      endCrawlLog(logId, 0, null, String(err));
      result.errors.push(`${slug}: ${err}`);
      console.warn(`  ${i + 1}/${slugsToFetch.length} ${slug}: failed - ${err}`);
    }
  }

  console.log(
    `  Done: ${result.detailPagesFetched} pages, ${result.modelsStored} new/changed models`
  );

  return result;
}