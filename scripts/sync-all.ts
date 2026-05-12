#!/usr/bin/env tsx

/**
 * sync-all.ts - Unified pipeline orchestrator.
 *
 * Runs the full crawler pipeline:
 *   1. Crawl data from sources
 *   2. Process raw data into models
 *   3. Translate to target languages
 *   4. Generate TypeScript data files
 *
 * Usage:
 *   npx tsx scripts/sync-all.ts              # incremental (default)
 *   npx tsx scripts/sync-all.ts --full       # full crawl
 *   npx tsx scripts/sync-all.ts --generate   # only regenerate TypeScript files
 */

import { migrate, getModelCount, getRawModelCount, closeDb } from "./lib/db";
import { crawlAll } from "./pipeline/crawl-all";
import { processModels } from "./pipeline/process-models";
import { translateModels } from "./pipeline/translate-models";
import { generateDataFiles } from "./pipeline/generate-data-files";
import { syncLeaderboard } from "./pipeline/sync-leaderboard";
import { syncPricing } from "./pipeline/sync-pricing";
import { syncBlog } from "./pipeline/sync-blog";

const args = process.argv.slice(2);
const fullMode = args.includes("--full") || process.env.CRAWL_MODE === "full";
const generateOnly = args.includes("--generate");

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  AI Models Navi Pipeline Sync");
  console.log("═══════════════════════════════════════\n");

  const mode = fullMode ? "full" : "incremental";
  console.log(`  Mode: ${mode}`);
  console.log(`  LLM: ${process.env.LLM_PROVIDER || "ollama"}/${process.env.LLM_MODEL || "gemma4:31b"}`);

  // Initialize database
  migrate();
  const dbModelsBefore = getModelCount();
  const dbRawBefore = getRawModelCount();
  console.log(`  DB: ${dbModelsBefore} models, ${dbRawBefore} raw records\n`);

  if (generateOnly) {
    console.log("  (generate-only mode: skipping crawl/process/translate)");
    const genResult = generateDataFiles();
    console.log(`\n  Generated ${genResult.modelsGenerated} models`);
    closeDb();
    return;
  }

  // Stage 1: Crawl
  const crawlResult = await crawlAll(mode);
  const totalNew =
    crawlResult.datalearner.modelsStored + crawlResult.huggingface.modelsStored;

  // Stage 2: Process
  const processResult = await processModels();

  // Stage 3: Translate
  const translateResult = await translateModels("ja");

  // Stage 3.5: Leaderboard & Pricing sync
  const leaderboardResult = await syncLeaderboard();
  const pricingResult = await syncPricing();

  // Stage 3.6: Blog sync (DataLearnerAI articles → Japanese)
  const blogResult = await syncBlog();

  // Stage 4: Generate
  const genResult = generateDataFiles();

  // Summary
  const dbModelsAfter = getModelCount();
  const dbRawAfter = getRawModelCount();

  console.log("\n═══════════════════════════════════════");
  console.log("  Pipeline Summary");
  console.log("═══════════════════════════════════════");
  console.log(`  Crawled: ${crawlResult.datalearner.detailPagesFetched} pages, ${totalNew} new/changed`);
  console.log(`  Processed: ${processResult.processed} new models`);
  console.log(`  Translated: ${translateResult.translated}`);
  console.log(`  Leaderboard: ${leaderboardResult.scoresStored} scores stored`);
  console.log(`  Pricing: ${pricingResult.totalEntries} entries from ${pricingResult.providerResults.filter(p => p.success).length} providers`);
  console.log(`  Blog: ${blogResult.processed} articles processed`);
  console.log(`  Generated: ${genResult.modelsGenerated} models in TypeScript`);
  console.log(`  DB: ${dbModelsBefore} → ${dbModelsAfter} models, ${dbRawBefore} → ${dbRawAfter} raw`);

  if (crawlResult.datalearner.errors.length > 0 || crawlResult.huggingface.errors.length > 0) {
    console.log(`  Errors: ${crawlResult.datalearner.errors.length + crawlResult.huggingface.errors.length}`);
    crawlResult.datalearner.errors.slice(0, 3).forEach((e) => console.log(`    - [DL] ${e}`));
    crawlResult.huggingface.errors.slice(0, 3).forEach((e) => console.log(`    - [HF] ${e}`));
  }

  console.log("\n  Pipeline complete!");
  closeDb();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  closeDb();
  process.exit(1);
});