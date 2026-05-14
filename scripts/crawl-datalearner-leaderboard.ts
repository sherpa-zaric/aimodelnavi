#!/usr/bin/env tsx

/**
 * Crawl leaderboard and benchmark data from datalearner.com
 *
 * Uses Playwright to:
 * 1. Navigate to leaderboard pages
 * 2. Click "load more" until all data is loaded
 * 3. Extract table data
 * 4. Store in SQLite
 *
 * Usage: npx tsx scripts/crawl-datalearner-leaderboard.ts
 */

import { chromium, Page } from "playwright";
import { getDb, migrate, getSourceId, startCrawlLog, endCrawlLog, contentHash } from "./lib/db";

// ── Types ──

interface LeaderboardEntry {
  rank: number;
  modelName: string;
  organization: string;
  scores: Record<string, number | null>;
  license: string;
  mode?: string; // thinking mode, tool use, etc.
  releaseDate?: string;
  params?: string;
}

interface BenchmarkInfo {
  name: string;
  slug: string;
  description: string;
  category: string;
  language: string;
  difficulty: string;
  institution: string;
  questionCount?: number;
}

interface CrawlResult {
  page: string;
  totalEntries: number;
  errors: string[];
}

// ── Page configurations ──

interface PageConfig {
  name: string;
  url: string;
  benchmarkKeys: string[];
  type: "leaderboard" | "benchmark";
}

const LEADERBOARD_PAGES: PageConfig[] = [
  {
    name: "main",
    url: "https://www.datalearner.com/leaderboards",
    benchmarkKeys: ["hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench"],
    type: "leaderboard",
  },
  {
    name: "aa-quality-index",
    url: "https://www.datalearner.com/leaderboards/external/aa-quality-index",
    benchmarkKeys: ["intelligenceIndex"],
    type: "leaderboard",
  },
  {
    name: "text-generation",
    url: "https://www.datalearner.com/leaderboards/external/text-generation",
    benchmarkKeys: ["elo"],
    type: "leaderboard",
  },
  {
    name: "math",
    url: "https://www.datalearner.com/leaderboards/category/math",
    benchmarkKeys: ["aime2025", "frontierMath", "math500", "gsm8k"],
    type: "leaderboard",
  },
  {
    name: "code",
    url: "https://www.datalearner.com/leaderboards/category/code",
    benchmarkKeys: ["sweBenchVerified", "liveCodeBench", "sweBenchPro"],
    type: "leaderboard",
  },
  {
    name: "agent",
    url: "https://www.datalearner.com/leaderboards/category/agent",
    benchmarkKeys: ["tauBench", "terminalBench", "aiderPolyglot"],
    type: "leaderboard",
  },
];

const BENCHMARK_PAGES: PageConfig[] = [
  { name: "hle", url: "https://www.datalearner.com/benchmarks/hle", benchmarkKeys: ["hle"], type: "benchmark" },
  { name: "arc-agi-2", url: "https://www.datalearner.com/benchmarks/arc-agi-2", benchmarkKeys: ["arcAgi2"], type: "benchmark" },
  { name: "frontier-math-tier-4", url: "https://www.datalearner.com/benchmarks/frontier-math-tier-4", benchmarkKeys: ["frontierMath"], type: "benchmark" },
  { name: "swe-bench-verified", url: "https://www.datalearner.com/benchmarks/swe-bench-verified", benchmarkKeys: ["sweBenchVerified"], type: "benchmark" },
  { name: "Tau-Squared-Benchmark", url: "https://www.datalearner.com/benchmarks/Tau-Squared-Benchmark", benchmarkKeys: ["tauBench"], type: "benchmark" },
  { name: "aime-2025", url: "https://www.datalearner.com/benchmarks/aime-2025", benchmarkKeys: ["aime2025"], type: "benchmark" },
  { name: "aime-2026", url: "https://www.datalearner.com/benchmarks/aime-2026", benchmarkKeys: ["aime2026"], type: "benchmark" },
  { name: "math-500", url: "https://www.datalearner.com/benchmarks/math-500", benchmarkKeys: ["math500"], type: "benchmark" },
  { name: "gsm8k", url: "https://www.datalearner.com/benchmarks/gsm8k", benchmarkKeys: ["gsm8k"], type: "benchmark" },
  { name: "mmlu-pro", url: "https://www.datalearner.com/benchmarks/mmlu-pro", benchmarkKeys: ["mmluPro"], type: "benchmark" },
  { name: "gpqa-diamond", url: "https://www.datalearner.com/benchmarks/gpqa-diamond", benchmarkKeys: ["gpqaDiamond"], type: "benchmark" },
  { name: "livecodebench", url: "https://www.datalearner.com/benchmarks/livecodebench", benchmarkKeys: ["liveCodeBench"], type: "benchmark" },
  { name: "swe-bench-pro", url: "https://www.datalearner.com/benchmarks/swe-bench-pro", benchmarkKeys: ["sweBenchPro"], type: "benchmark" },
  { name: "terminalbench-hard", url: "https://www.datalearner.com/benchmarks/terminalbench-hard", benchmarkKeys: ["terminalBench"], type: "benchmark" },
  { name: "aider-benchmark", url: "https://www.datalearner.com/benchmarks/aider-benchmark", benchmarkKeys: ["aiderPolyglot"], type: "benchmark" },
];

// ── Helper functions ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNumber(text: string): number | null {
  if (!text || text === "—" || text === "-" || text === "N/A") return null;
  const cleaned = text.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseRank(text: string): number {
  const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Playwright extraction ──

async function loadAllData(page: Page): Promise<void> {
  let previousCount = 0;
  let attempts = 0;
  const maxAttempts = 50; // Safety limit

  while (attempts < maxAttempts) {
    // Check if there's a "load more" button
    const loadMoreBtn = page.locator('button:has-text("加载更多")');
    const isVisible = await loadMoreBtn.isVisible().catch(() => false);

    if (!isVisible) {
      console.log(`    No more "load more" button`);
      break;
    }

    // Get current count
    const countText = await page.locator('text=/已显示 \\d+ \\/ \\d+/').textContent().catch(() => "");
    const match = countText.match(/已显示 (\d+) \/ (\d+)/);
    const currentCount = match ? parseInt(match[1]) : 0;
    const totalCount = match ? parseInt(match[2]) : 0;

    if (currentCount >= totalCount) {
      console.log(`    All ${totalCount} models loaded`);
      break;
    }

    if (currentCount === previousCount && attempts > 0) {
      console.log(`    Count didn't increase (${currentCount}), stopping`);
      break;
    }

    previousCount = currentCount;
    console.log(`    Loading more... (${currentCount}/${totalCount})`);

    // Click load more
    await loadMoreBtn.click();
    await sleep(1500); // Wait for data to load
    attempts++;
  }
}

async function extractTableData(page: Page, benchmarkKeys: string[]): Promise<LeaderboardEntry[]> {
  // Wait for table to be present
  await page.waitForSelector("table", { timeout: 10000 }).catch(() => {});

  // Capture console logs from page.evaluate()
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "log") {
      consoleLogs.push(msg.text());
    }
  });

  const entries = await page.evaluate((keys) => {
    const rows = document.querySelectorAll("table tbody tr");
    const results: any[] = [];

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) return;

      // Parse rank
      const rankText = cells[0]?.textContent?.trim() || "";
      const rank = parseInt(rankText) || 0;

      // Parse model name and organization from the second cell
      const modelCell = cells[1];
      let modelName = "";
      let organization = "";

      // Strategy 1: Look for model name in span with specific classes
      const modelNameSelectors = [
        'span.block.truncate',
        'span[class*="block"][class*="max-w"][class*="truncate"]',
        'span[class*="truncate"][class*="block"]',
        'a span[class*="truncate"]',
        'a',
      ];

      for (const selector of modelNameSelectors) {
        const el = modelCell?.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 0) {
            modelName = text;
            break;
          }
        }
      }

      // Strategy 2: Look for organization in specific elements
      const orgSelectors = [
        '[class*="text-slate-400"][class*="text-xs"]',
        '[class*="mt-0.5"][class*="truncate"][class*="text-xs"]',
        '[class*="text-xs"][class*="text-slate-400"]',
        'div[class*="text-xs"][class*="truncate"]',
      ];

      for (const selector of orgSelectors) {
        const el = modelCell?.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 0) {
            organization = text;
            break;
          }
        }
      }

      // Strategy 3: Fallback to text parsing
      if (!modelName || !organization) {
        const fullText = modelCell?.textContent?.trim() || "";
        const lines = fullText.split(/\n/).map(l => l.trim()).filter(Boolean);

        if (!modelName && lines.length > 0) {
          modelName = lines[0];
        }
        if (!organization && lines.length >= 2) {
          organization = lines[1];
        }
      }

      // Debug: log first 3 rows
      if (rowIndex < 3) {
        console.log(`[DEBUG] Row ${rowIndex}: model="${modelName}", org="${organization}"`);
      }

      // Extract thinking mode / tool use badges
      const modeBadges = modelCell?.querySelectorAll('[class*="rounded-full"][class*="text-[11px]"]');
      const modes: string[] = [];
      modeBadges?.forEach((badge) => {
        const text = badge.textContent?.trim();
        if (text) modes.push(text);
      });
      const mode = modes.length > 0 ? modes.join(" · ") : undefined;

      // Parse scores
      const scores: Record<string, number | null> = {};
      for (let i = 0; i < keys.length; i++) {
        const scoreText = cells[i + 2]?.textContent?.trim() || "";
        scores[keys[i]] = scoreText === "—" || scoreText === "-" ? null : parseFloat(scoreText) || null;
      }

      // Parse license
      const license = cells[cells.length - 1]?.textContent?.trim() || "";

      results.push({ rank, modelName, organization, scores, license, mode });
    });

    return results;
  }, benchmarkKeys);

  // Print captured console logs
  for (const log of consoleLogs) {
    if (log.includes("[DEBUG]")) {
      console.log(`    ${log}`);
    }
  }

  return entries;
}

async function extractBenchmarkInfo(page: Page): Promise<Partial<BenchmarkInfo>> {
  return page.evaluate(() => {
    const info: any = {};

    // Try to find benchmark name
    const h1 = document.querySelector("h1");
    if (h1) info.name = h1.textContent?.trim();

    // Try to find description
    const desc = document.querySelector('p[class*="description"], meta[name="description"]');
    if (desc) info.description = desc.textContent?.trim() || (desc as HTMLMetaElement).content;

    // Try to find stats
    const statsText = document.body.innerText;
    const questionMatch = statsText.match(/(\d+)\s*(?:道|题|个|questions)/);
    if (questionMatch) info.questionCount = parseInt(questionMatch[1]);

    return info;
  });
}

// ── Main crawl function ──

async function crawlPage(
  page: Page,
  config: PageConfig
): Promise<CrawlResult> {
  const result: CrawlResult = {
    page: config.name,
    totalEntries: 0,
    errors: [],
  };

  console.log(`\n[Crawling] ${config.name} (${config.url})`);

  try {
    // Navigate to page (longer timeout for main leaderboard)
    const timeout = config.name === "main" ? 60000 : 30000;
    await page.goto(config.url, { waitUntil: "domcontentloaded", timeout });
    await sleep(3000);

    // Load all data by clicking "load more"
    await loadAllData(page);

    // Extract table data
    const entries = await extractTableData(page, config.benchmarkKeys);
    result.totalEntries = entries.length;

    console.log(`  Extracted ${entries.length} entries`);

    // Store in database
    const db = getDb();
    const sourceId = getSourceId("datalearner-leaderboard");
    console.log(`  Source ID: ${sourceId}`);
    const logId = startCrawlLog(sourceId, config.url, "full");

    // Store as raw model data
    for (const entry of entries) {
      if (!entry.modelName) continue;

      const slug = slugify(entry.modelName);
      const rawData = {
        type: config.type,
        page: config.name,
        rank: entry.rank,
        modelName: entry.modelName,
        organization: entry.organization,
        scores: entry.scores,
        license: entry.license,
        mode: entry.mode,
      };

      // Use composite key: page + slug
      const externalId = `${config.type}:${config.name}:${slug}`;

      try {
        db.prepare(`
          INSERT INTO raw_models (source_id, external_id, source_url, raw_data, content_hash)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(source_id, external_id) DO UPDATE SET
            raw_data = excluded.raw_data,
            content_hash = excluded.content_hash,
            last_seen_at = datetime('now')
        `).run(
          sourceId,
          externalId,
          config.url,
          JSON.stringify(rawData),
          contentHash(JSON.stringify(rawData))
        );
      } catch (err) {
        result.errors.push(`Storing ${entry.modelName}: ${err}`);
      }
    }

    endCrawlLog(logId, 200, null, null);
  } catch (err) {
    result.errors.push(`Page load: ${err}`);
    console.error(`  Error: ${err}`);
  }

  return result;
}

// ── Entry point ──

async function main() {
  console.log("=== DataLearner Leaderboard Crawler ===\n");

  migrate();
  const db = getDb();

  // Ensure data source exists
  db.prepare(`
    INSERT OR IGNORE INTO data_sources (name, base_url) VALUES (?, ?)
  `).run("datalearner-leaderboard", "https://www.datalearner.com/leaderboards");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "ja-JP",
  });
  const page = await context.newPage();

  const allResults: CrawlResult[] = [];

  // Crawl leaderboard pages
  console.log("=== Leaderboard Pages ===");
  for (const config of LEADERBOARD_PAGES) {
    const result = await crawlPage(page, config);
    allResults.push(result);
    await sleep(2000); // Rate limit
  }

  // Crawl benchmark pages
  console.log("\n=== Benchmark Pages ===");
  for (const config of BENCHMARK_PAGES) {
    const result = await crawlPage(page, config);
    allResults.push(result);
    await sleep(2000); // Rate limit
  }

  await browser.close();

  // Summary
  console.log("\n=== Summary ===\n");
  let totalEntries = 0;
  let totalErrors = 0;
  for (const result of allResults) {
    console.log(`${result.page}: ${result.totalEntries} entries, ${result.errors.length} errors`);
    totalEntries += result.totalEntries;
    totalErrors += result.errors.length;
    if (result.errors.length > 0) {
      result.errors.forEach((e) => console.log(`  Error: ${e}`));
    }
  }
  console.log(`\nTotal: ${totalEntries} entries, ${totalErrors} errors`);
}

main().catch(console.error);
