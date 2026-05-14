#!/usr/bin/env tsx

/**
 * Generate leaderboard TypeScript data files from SQLite database.
 *
 * Reads from raw_models table (source_id = 408) and generates:
 * - src/data/leaderboard.ts (main leaderboard with all benchmark scores)
 * - src/data/benchmarks.ts (benchmark definitions and per-benchmark rankings)
 *
 * Usage: npx tsx scripts/generate-leaderboard-data.ts
 */

import { getDb, migrate } from "./lib/db";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

// ── Types ──

interface RawLeaderboardEntry {
  external_id: string;
  raw_data: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  developer: string;
  mode?: string;
  scores: Record<string, number | null>;
  license: string;
  source: string; // main, math, code, agent, aa-quality-index, text-generation
}

interface BenchmarkDefinition {
  key: string;
  name: string;
  nameJa: string;
  description: string;
  category: string;
  maxScore: number | null;
  unit: string;
}

// ── Benchmark definitions ──

const BENCHMARK_DEFS: Record<string, BenchmarkDefinition> = {
  hle: {
    key: "hle",
    name: "HLE",
    nameJa: "Human-Like Evaluation",
    description: "総合知能テスト — 人間レベルの推論能力を測定",
    category: "comprehensive",
    maxScore: 100,
    unit: "score",
  },
  arcAgi2: {
    key: "arcAgi2",
    name: "ARC-AGI-2",
    nameJa: "ARC-AGI-2",
    description: "抽象的推論ベンチマーク — 新規パターンの汎化能力を測定",
    category: "reasoning",
    maxScore: 100,
    unit: "score",
  },
  frontierMath: {
    key: "frontierMath",
    name: "FrontierMath - Tier 4",
    nameJa: "FrontierMath ティア4",
    description: "高度な数学問題 — 研究レベルの数学的推論能力を測定",
    category: "math",
    maxScore: 100,
    unit: "score",
  },
  sweBenchVerified: {
    key: "sweBenchVerified",
    name: "SWE-bench Verified",
    nameJa: "SWE-bench Verified",
    description: "実践的ソフトウェア開発タスク — 実際のバグ修正能力を測定",
    category: "coding",
    maxScore: 100,
    unit: "score",
  },
  tauBench: {
    key: "tauBench",
    name: "τ²-Bench",
    nameJa: "τ²-Bench",
    description: "自律エージェントタスク — ツール呼び出しと推論の組み合わせ能力を測定",
    category: "agent",
    maxScore: 100,
    unit: "score",
  },
  aime2025: {
    key: "aime2025",
    name: "AIME 2025",
    nameJa: "AIME 2025",
    description: "American Invitational Mathematics Examination 2025 — 高校生レベルの数学コンテスト",
    category: "math",
    maxScore: 100,
    unit: "score",
  },
  aime2026: {
    key: "aime2026",
    name: "AIME 2026",
    nameJa: "AIME 2026",
    description: "American Invitational Mathematics Examination 2026 — 高校生レベルの数学コンテスト",
    category: "math",
    maxScore: 100,
    unit: "score",
  },
  math500: {
    key: "math500",
    name: "MATH-500",
    nameJa: "MATH-500",
    description: "数学問題セット — 幅広い数学分野の問題解決能力を測定",
    category: "math",
    maxScore: 100,
    unit: "score",
  },
  gsm8k: {
    key: "gsm8k",
    name: "GSM8K",
    nameJa: "GSM8K",
    description: "Grade School Math 8K — 小学校レベルの数学的推論能力を測定",
    category: "math",
    maxScore: 100,
    unit: "score",
  },
  mmluPro: {
    key: "mmluPro",
    name: "MMLU-Pro",
    nameJa: "MMLU-Pro",
    description: "Massive Multitask Language Understanding Pro — 幅広い知識分野の理解能力を測定",
    category: "comprehensive",
    maxScore: 100,
    unit: "score",
  },
  gpqaDiamond: {
    key: "gpqaDiamond",
    name: "GPQA Diamond",
    nameJa: "GPQA Diamond",
    description: "Graduate-Level Google-Proof Q&A — 大学院レベルの科学的推論能力を測定",
    category: "reasoning",
    maxScore: 100,
    unit: "score",
  },
  liveCodeBench: {
    key: "liveCodeBench",
    name: "LiveCodeBench",
    nameJa: "LiveCodeBench",
    description: "リアルタイムコーディングベンチマーク — 最新のプログラミング問題への対応能力を測定",
    category: "coding",
    maxScore: 100,
    unit: "score",
  },
  sweBenchPro: {
    key: "sweBenchPro",
    name: "SWE-bench Pro",
    nameJa: "SWE-bench Pro",
    description: "プロフェッショナルSWEベンチマーク — より複雑なソフトウェア開発タスクを測定",
    category: "coding",
    maxScore: 100,
    unit: "score",
  },
  terminalBench: {
    key: "terminalBench",
    name: "Terminal Bench Hard",
    nameJa: "Terminal Bench Hard",
    description: "ターミナルベースのエージェントタスク — CLI環境での自律的能力を測定",
    category: "agent",
    maxScore: 100,
    unit: "score",
  },
  aiderPolyglot: {
    key: "aiderPolyglot",
    name: "Aider-Polyglot",
    nameJa: "Aider-Polyglot",
    description: "多言語コーディングアシスタントベンチマーク — 複数プログラミング言語のコーディング能力を測定",
    category: "coding",
    maxScore: 100,
    unit: "score",
  },
  intelligenceIndex: {
    key: "intelligenceIndex",
    name: "AA Intelligence Index",
    nameJa: "AA インテリジェンス指数",
    description: "Artificial Analysis 総合智能指数 — 10種の標準化テストの総合スコア",
    category: "comprehensive",
    maxScore: 100,
    unit: "score",
  },
  elo: {
    key: "elo",
    name: "LMArena Elo",
    nameJa: "LMArena Elo",
    description: "LMArena（旧Chatbot Arena）のEloレーティング — ユーザー匿名盲テストによる総合評価",
    category: "comprehensive",
    maxScore: null,
    unit: "Elo",
  },
};

// ── Helper functions ──

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// ── Main generation ──

function generateLeaderboardData() {
  migrate();
  const db = getDb();

  console.log("=== Generating Leaderboard Data ===\n");

  // Read all leaderboard data
  const rows = db.prepare(`
    SELECT external_id, raw_data
    FROM raw_models
    WHERE source_id = 408
    ORDER BY external_id
  `).all() as RawLeaderboardEntry[];

  console.log(`Found ${rows.length} records`);

  // Parse and organize data
  const allEntries: LeaderboardEntry[] = [];
  const byPage: Record<string, LeaderboardEntry[]> = {};

  for (const row of rows) {
    try {
      const data = JSON.parse(row.raw_data);
      const entry: LeaderboardEntry = {
        rank: data.rank || 0,
        name: data.modelName || "",
        developer: data.organization || "",
        mode: data.mode,
        scores: data.scores || {},
        license: data.license || "",
        source: data.page || "unknown",
      };

      allEntries.push(entry);

      if (!byPage[entry.source]) {
        byPage[entry.source] = [];
      }
      byPage[entry.source].push(entry);
    } catch (err) {
      console.warn(`Failed to parse: ${row.external_id}`);
    }
  }

  console.log(`Parsed ${allEntries.length} entries`);
  console.log(`Pages: ${Object.keys(byPage).join(", ")}`);

  // Generate leaderboard.ts with main leaderboard data
  generateMainLeaderboard(byPage["main"] || []);

  // Generate benchmarks.ts with all benchmark data
  generateBenchmarksData(byPage);

  console.log("\n=== Generation Complete ===");
}

function generateMainLeaderboard(entries: LeaderboardEntry[]) {
  console.log(`\nGenerating leaderboard.ts with ${entries.length} entries...`);

  // Build a map of all scores per model
  const modelScores = new Map<string, {
    name: string;
    developer: string;
    scores: Record<string, number | null>;
    license: string;
    mode?: string;
  }>();

  for (const entry of entries) {
    const key = entry.name.toLowerCase().replace(/\s+/g, "-");
    if (!modelScores.has(key)) {
      modelScores.set(key, {
        name: entry.name,
        developer: entry.developer,
        scores: {},
        license: entry.license,
        mode: entry.mode,
      });
    }
    const model = modelScores.get(key)!;
    Object.assign(model.scores, entry.scores);
  }

  // Convert to array and sort by HLE score
  const ranked = Array.from(modelScores.values())
    .map((m, i) => ({
      rank: i + 1,
      name: m.name,
      developer: m.developer,
      hle: m.scores.hle ?? null,
      arcAgi2: m.scores.arcAgi2 ?? null,
      frontierMath: m.scores.frontierMath ?? null,
      sweBenchVerified: m.scores.sweBenchVerified ?? null,
      tauBench: m.scores.tauBench ?? null,
      openSource: m.license === "闭源" ? "closed" : m.license === "免费商用" ? "open" : "open-nc",
      type: "foundation",
      releaseDate: "",
    }))
    .sort((a, b) => (b.hle ?? 0) - (a.hle ?? 0))
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const data = JSON.stringify(ranked, null, 2);

  const content = `// Auto-generated by generate-leaderboard-data.ts
// Last updated: ${new Date().toISOString()}
// Source: datalearner.com leaderboard data
// DO NOT EDIT MANUALLY

export interface ModelRanking {
  rank: number;
  name: string;
  developer: string;
  hle: number | null;
  arcAgi2: number | null;
  frontierMath: number | null;
  sweBenchVerified: number | null;
  tauBench: number | null;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  releaseDate: string;
}

export const leaderboardData: ModelRanking[] = ${data};
`;

  fs.writeFileSync(path.join(DATA_DIR, "leaderboard.ts"), content);
  console.log(`  Written ${ranked.length} entries to leaderboard.ts`);
}

function generateBenchmarksData(byPage: Record<string, LeaderboardEntry[]>) {
  console.log("\nGenerating benchmarks.ts...");

  // Build benchmark rankings
  const benchmarkRankings: Record<string, { name: string; developer: string; score: number; mode?: string }[]> = {};

  // Map page names to benchmark keys
  const pageToBenchmark: Record<string, string> = {
    hle: "hle",
    "arc-agi-2": "arcAgi2",
    "frontier-math-tier-4": "frontierMath",
    "swe-bench-verified": "sweBenchVerified",
    "Tau-Squared-Benchmark": "tauBench",
    "aime-2025": "aime2025",
    "aime-2026": "aime2026",
    "math-500": "math500",
    gsm8k: "gsm8k",
    "mmlu-pro": "mmluPro",
    "gpqa-diamond": "gpqaDiamond",
    livecodebench: "liveCodeBench",
    "swe-bench-pro": "sweBenchPro",
    "terminalbench-hard": "terminalBench",
    "aider-benchmark": "aiderPolyglot",
  };

  for (const [page, entries] of Object.entries(byPage)) {
    const benchmarkKey = pageToBenchmark[page];
    if (!benchmarkKey) continue;

    const rankings = entries
      .map((e) => ({
        name: e.name,
        developer: e.developer,
        score: Object.values(e.scores)[0] ?? 0,
        mode: e.mode,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    benchmarkRankings[benchmarkKey] = rankings;
  }

  // Build benchmarks array
  const benchmarks = Object.values(BENCHMARK_DEFS).map((def) => ({
    ...def,
    rankings: benchmarkRankings[def.key] || [],
    totalModels: (benchmarkRankings[def.key] || []).length,
  }));

  const data = JSON.stringify(benchmarks, null, 2);

  const content = `// Auto-generated by generate-leaderboard-data.ts
// Last updated: ${new Date().toISOString()}
// Source: datalearner.com benchmark data
// DO NOT EDIT MANUALLY

export interface BenchmarkRanking {
  name: string;
  developer: string;
  score: number;
  mode?: string;
}

export interface Benchmark {
  key: string;
  name: string;
  nameJa: string;
  description: string;
  category: string;
  maxScore: number | null;
  unit: string;
  rankings: BenchmarkRanking[];
  totalModels: number;
}

export const benchmarksData: Benchmark[] = ${data};

export function getBenchmarkByKey(key: string): Benchmark | undefined {
  return benchmarksData.find((b) => b.key === key);
}

export function getBenchmarksByCategory(category: string): Benchmark[] {
  return benchmarksData.filter((b) => b.category === category);
}
`;

  fs.writeFileSync(path.join(DATA_DIR, "benchmarks.ts"), content);
  console.log(`  Written ${benchmarks.length} benchmarks to benchmarks.ts`);
}

// Run
generateLeaderboardData();
