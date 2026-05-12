#!/usr/bin/env tsx

/**
 * sync-leaderboard.ts (Pipeline version)
 *
 * Fetches AI model benchmark data from public sources and stores in SQLite.
 * Sources:
 *   - LMSYS Chatbot Arena (Elo rankings)
 *   - HuggingFace Open LLM Leaderboard
 *
 * Uses LLM to extract structured data from HTML.
 * Stores results in leaderboard_scores table.
 *
 * Usage: npx tsx scripts/pipeline/sync-leaderboard.ts
 */

import { extractFromHTML, validateData } from "../lib/anthropic";
import { getDb, migrate, getSourceId, startCrawlLog, endCrawlLog } from "../lib/db";
import { rateLimitedFetch } from "../lib/http";

interface BenchmarkScore {
  modelName: string;
  developer: string;
  hle: number | null;
  arcAgi2: number | null;
  frontierMath: number | null;
  sweBenchVerified: number | null;
  tauBench: number | null;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  releaseDate: string;
  eloScore?: number | null;
}

const SCHEMA_INSTRUCTIONS = `Extract a list of AI model benchmark scores. For each model, extract:
- modelName: exact model name
- developer: company/organization name (Anthropic, OpenAI, Google DeepMind, Alibaba, DeepSeek-AI, xAI, Zhipu AI, Meta, Mistral, etc.)
- hle: HLE benchmark score (number or null)
- arcAgi2: ARC-AGI-2 score (number or null)
- frontierMath: FrontierMath Tier 4 score (number or null)
- sweBenchVerified: SWE-bench Verified score (number or null)
- tauBench: τ²-Bench score (number or null)
- openSource: "open" | "closed" | "open-nc"
- type: "reasoning" | "foundation" | "chat" | "coder"
- releaseDate: release date in YYYY-MM-DD format
- eloScore: Elo rating if available (number or null)`;

const BENCHMARKS: (keyof Omit<BenchmarkScore, "modelName" | "developer" | "openSource" | "type" | "releaseDate">)[] = [
  "hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function syncLmsys(): Promise<Partial<BenchmarkScore>[]> {
  console.log("\n[1/2] Syncing LMSYS Chatbot Arena...");

  const sourceId = getSourceId("leaderboard");
  const db = getDb();

  try {
    const logId = startCrawlLog(sourceId, "https://lmarena.ai/", "incremental");

    let html: string;
    try {
      const res = await rateLimitedFetch("https://lmarena.ai/");
      html = res.body;
    } catch {
      // lmarena.ai might redirect or block, try chat.lmsys.org
      const res = await rateLimitedFetch("https://chat.lmsys.org/");
      html = res.body;
    }

    const data = await extractFromHTML<Partial<BenchmarkScore>[]>(
      html.slice(0, 30000),
      "Array<{modelName: string, eloScore: number, developer: string}>",
      "Extract the leaderboard table from LMSYS Chatbot Arena. Get model names, Elo scores, and developer names."
    );

    endCrawlLog(logId, 200, null, null);
    console.log(`  Extracted ${data.length} models from LMSYS`);

    // Store raw data and scores
    for (const score of data) {
      if (!score.modelName) continue;

      const slug = slugify(score.modelName);

      // Find or create model in models table
      let modelId: number | null = null;
      const existing = db.prepare("SELECT id FROM models WHERE slug = ?").get(slug) as { id: number } | undefined;
      if (existing) {
        modelId = existing.id;
      }

      // Store Elo score in leaderboard_scores if we have it
      if (score.eloScore != null && modelId) {
        db.prepare(
          `INSERT OR REPLACE INTO leaderboard_scores (model_id, benchmark, score, source_url)
           VALUES (?, 'elo', ?, 'https://lmarena.ai/')`
        ).run(modelId, score.eloScore);
      }
    }

    return data;
  } catch (err) {
    console.error(`  LMSYS sync failed: ${err}`);
    return [];
  }
}

async function syncHuggingFace(): Promise<Partial<BenchmarkScore>[]> {
  console.log("\n[2/2] Syncing HuggingFace Open LLM Leaderboard...");

  try {
    const res = await rateLimitedFetch("https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard");
    const html = res.body;
    const data = await extractFromHTML<BenchmarkScore[]>(
      html.slice(0, 30000),
      "Array<BenchmarkScore>",
      SCHEMA_INSTRUCTIONS
    );
    console.log(`  Extracted ${data.length} models from HuggingFace`);
    return data;
  } catch (err) {
    console.error(`  HuggingFace sync failed: ${err}`);
    return [];
  }
}

function storeScores(scores: Partial<BenchmarkScore>[]): number {
  const db = getDb();
  let stored = 0;

  const upsertScore = db.prepare(
    `INSERT INTO leaderboard_scores (model_id, benchmark, score, source_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(model_id, benchmark, source_url) DO UPDATE SET score = excluded.score`
  );

  for (const score of scores) {
    if (!score.modelName) continue;

    const slug = slugify(score.modelName);

    // Find model in models table
    let modelId: number | null = null;
    const existing = db.prepare("SELECT id FROM models WHERE slug = ?").get(slug) as { id: number } | undefined;

    if (existing) {
      modelId = existing.id;
    } else {
      // Try fuzzy match by name
      const fuzzyMatch = db.prepare("SELECT id FROM models WHERE name LIKE ? LIMIT 1").get(`%${score.modelName}%`) as { id: number } | undefined;
      if (fuzzyMatch) {
        modelId = fuzzyMatch.id;
      } else {
        // Create a placeholder model
        const result = db.prepare(
          `INSERT INTO models (slug, name, developer, license_status, category, release_date)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          slug,
          score.modelName,
          score.developer || "Unknown",
          score.openSource || "closed",
          score.type || "foundation",
          score.releaseDate || new Date().toISOString().slice(0, 10)
        );
        modelId = Number(result.lastInsertRowid);
      }
    }

    if (!modelId) continue;

    // Store each benchmark score
    for (const benchmark of BENCHMARKS) {
      const value = score[benchmark];
      if (value != null) {
        upsertScore.run(modelId, benchmark, value, "https://huggingface.co/spaces/open-llm-leaderboard");
        stored++;
      }
    }

    // Store Elo if available
    if (score.eloScore != null) {
      upsertScore.run(modelId, "elo", score.eloScore, "https://lmarena.ai/");
      stored++;
    }
  }

  return stored;
}

export async function syncLeaderboard(): Promise<{
  lmsysCount: number;
  hfCount: number;
  scoresStored: number;
}> {
  migrate();

  const [lmsysData, hfData] = await Promise.all([
    syncLmsys(),
    syncHuggingFace(),
  ]);

  const allScores = [...lmsysData, ...hfData];
  const scoresStored = storeScores(allScores);

  // Validate
  if (allScores.length > 0) {
    const validation = await validateData(allScores, "AI model benchmark scores");
    if (!validation.valid) {
      console.warn("  ⚠️  Validation warnings:");
      validation.issues.forEach((i) => console.warn(`     - ${i}`));
    }
  }

  console.log(`\n  Leaderboard sync: ${lmsysData.length} LMSYS, ${hfData.length} HF, ${scoresStored} scores stored`);

  return {
    lmsysCount: lmsysData.length,
    hfCount: hfData.length,
    scoresStored,
  };
}

// Allow direct execution
if (process.argv[1]?.endsWith("sync-leaderboard.ts")) {
  syncLeaderboard()
    .then((r) => console.log(`Done: ${r.scoresStored} scores stored`))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}