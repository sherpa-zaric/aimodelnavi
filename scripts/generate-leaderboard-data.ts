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
  clawBench: {
    key: "clawBench",
    name: "Claw Bench",
    nameJa: "Claw Bench",
    description: "OpenClawエージェントベンチマーク — OpenClawプラットフォームでのエージェント性能を測定",
    category: "agent",
    maxScore: 100,
    unit: "score",
  },
  pinchBench: {
    key: "pinchBench",
    name: "Pinch Bench",
    nameJa: "Pinch Bench",
    description: "OpenClawピンチベンチマーク — OpenClawプラットフォームでのタスク遂行能力を測定",
    category: "agent",
    maxScore: 100,
    unit: "score",
  },
  arcadaCode: {
    key: "arcadaCode",
    name: "Arcada Code",
    nameJa: "Arcada Code",
    description: "Arcadaコーディングベンチマーク — コード生成品質のCrowdsourced評価",
    category: "coding",
    maxScore: 100,
    unit: "score",
  },
};

// ── Helper functions ──

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// Translate Chinese developer names to Japanese
const developerJaMap: Record<string, string> = {
  "阿里巴巴": "アリババ",
  "Alibaba": "アリババ",
  "智谱AI": "Zhipu AI",
  "Zhipu AI": "Zhipu AI",
  "百度": "バイドゥ",
  "Baidu": "バイドゥ",
  "腾讯AI实验室": "テンセントAI研究所",
  "Tencent": "テンセント",
  "Tencent ARC": "テンセント",
  "华为": "ファーウェイ",
  "Huawei": "ファーウェイ",
  "亚马逊": "アマゾン",
  "Amazon": "アマゾン",
  "上海人工智能实验室": "上海人工知能研究所",
  "普林斯顿大学": "プリンストン大学",
  "Princeton": "プリンストン大学",
  "Facebook AI研究实验室": "Meta AI",
  "Meta": "Meta AI",
  "DeepSeek-AI": "DeepSeek",
  "小米": "Xiaomi",
  "字节跳动": "ByteDance",
  "网易": "NetEase",
  "科大讯飞": "iFlytek",
  "商汤": "SenseTime",
  "旷视": "Megvii",
  "Google Deep Mind": "Google DeepMind",
  "DeepMind": "Google DeepMind",
  "Google": "Google",
  "Nvidia": "NVIDIA",
  "MistralAI": "Mistral",
  "Moonshot AI": "Moonshot AI",
  "MiniMaxAI": "MiniMax",
  "StepFunAI": "StepFun",
  "IBM": "IBM",
  "xAI": "xAI",
  "OpenAI": "OpenAI",
  "Anthropic": "Anthropic",
};

function translateDeveloper(dev: string): string {
  return developerJaMap[dev] || dev;
}

// Translate Chinese mode strings to Japanese
const modeJaMap: Record<string, string> = {
  "思考水平": "思考レベル",
  "扩展思考": "拡張思考",
  "开启思考": "思考有効",
  "常规模式": "通常モード",
  "深度思考模式": "深度思考モード",
  "极高": "極高",
  "高": "高",
  "中": "中",
  "低": "低",
  "工具": "ツール",
  "联网": "ウェブ検索",
  "搜索": "検索",
};

function translateMode(mode: string): string {
  if (!mode) return mode;
  let result = mode;
  for (const [cn, ja] of Object.entries(modeJaMap)) {
    result = result.replace(new RegExp(cn, "g"), ja);
  }
  return result;
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
    WHERE source_id = (SELECT id FROM data_sources WHERE name = 'datalearner-leaderboard')
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

      // Skip entries with empty or numeric-only model names (crawl artifacts)
      if (!entry.name || /^\d+$/.test(entry.name)) {
        continue;
      }

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

  // Build a developer lookup map from all entries that have developers
  const developerLookup = new Map<string, string>();
  for (const entry of allEntries) {
    if (entry.developer) {
      const key = entry.name.toLowerCase().replace(/\s+/g, "-");
      if (!developerLookup.has(key)) {
        developerLookup.set(key, entry.developer);
      }
    }
  }
  console.log(`Developer lookup: ${developerLookup.size} models with known developers`);

  // Generate leaderboard.ts with ALL pages merged
  generateMainLeaderboard(allEntries);

  // Generate benchmarks.ts with all benchmark data
  generateBenchmarksData(byPage, developerLookup);

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
    // Prefer non-empty developer/license/mode from any entry
    if (!model.developer && entry.developer) model.developer = entry.developer;
    if (!model.license && entry.license) model.license = entry.license;
    if (!model.mode && entry.mode) model.mode = entry.mode;
    Object.assign(model.scores, entry.scores);
  }

  // Load model types from models.ts if available
  let modelTypes: Record<string, string> = {};
  try {
    const modelsPath = path.join(DATA_DIR, "models.ts");
    if (fs.existsSync(modelsPath)) {
      const modelsContent = fs.readFileSync(modelsPath, "utf-8");
      // Extract type information using regex
      const typeMatches = modelsContent.matchAll(/slug:\s*"([^"]+)"[\s\S]*?type:\s*"([^"]+)"/g);
      for (const match of typeMatches) {
        modelTypes[match[1]] = match[2];
      }
      console.log(`  Loaded ${Object.keys(modelTypes).length} model types from models.ts`);
    }
  } catch (err) {
    console.warn(`  Could not load model types: ${err}`);
  }

  // Infer model type from name patterns
  function inferModelType(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("thinking") || lower.includes("reasoning") || lower.includes("o1") || lower.includes("o3") || lower.includes("o4")) {
      return "reasoning";
    }
    if (lower.includes("coder") || lower.includes("code") || lower.includes("codex")) {
      return "coder";
    }
    if (lower.includes("chat") || lower.includes("instruct")) {
      return "chat";
    }
    return "foundation";
  }

  // All benchmark keys
  const allBenchmarkKeys = [
    "hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench",
    "aime2025", "aime2026", "math500", "gsm8k",
    "mmluPro", "gpqaDiamond",
    "liveCodeBench", "sweBenchPro",
    "terminalBench", "aiderPolyglot",
    "intelligenceIndex", "elo",
    "clawBench", "pinchBench", "arcadaCode",
  ];

  // Convert to array and sort by HLE score
  const ranked = Array.from(modelScores.values())
    .map((m) => {
      const slug = m.name.toLowerCase().replace(/\s+/g, "-");
      const type = modelTypes[slug] || inferModelType(m.name);

      const scores: Record<string, number | null> = {};
      for (const key of allBenchmarkKeys) {
        scores[key] = m.scores[key] ?? null;
      }

      return {
        name: m.name,
        developer: translateDeveloper(m.developer),
        ...scores,
        openSource: m.license === "闭源" ? "closed" : m.license === "免费商用" ? "open" : m.license === "不可商用" ? "open-nc" : "closed",
        type: type as "reasoning" | "foundation" | "chat" | "coder",
        releaseDate: "",
      };
    })
    .sort((a, b) => ((b as Record<string, number | null>).hle ?? 0) - ((a as Record<string, number | null>).hle ?? 0))
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
  aime2025: number | null;
  aime2026: number | null;
  math500: number | null;
  gsm8k: number | null;
  mmluPro: number | null;
  gpqaDiamond: number | null;
  liveCodeBench: number | null;
  sweBenchPro: number | null;
  terminalBench: number | null;
  aiderPolyglot: number | null;
  intelligenceIndex: number | null;
  elo: number | null;
  clawBench: number | null;
  pinchBench: number | null;
  arcadaCode: number | null;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  releaseDate: string;
}

export const leaderboardData: ModelRanking[] = ${data};
`;

  fs.writeFileSync(path.join(DATA_DIR, "leaderboard.ts"), content);
  console.log(`  Written ${ranked.length} entries to leaderboard.ts`);
}

function generateBenchmarksData(byPage: Record<string, LeaderboardEntry[]>, developerLookup: Map<string, string>) {
  console.log("\nGenerating benchmarks.ts...");

  // Build benchmark rankings
  const benchmarkRankings: Record<string, { name: string; developer: string; score: number; mode?: string }[]> = {};

  // Map page names to benchmark keys (single-benchmark pages)
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
    "arcada-code": "arcadaCode",
  };

  // Map multi-benchmark pages to their benchmark keys
  const multiBenchmarkPages: Record<string, string[]> = {
    openclaw: ["clawBench", "pinchBench"],
  };

  function buildRankings(entries: LeaderboardEntry[], scoreKey?: string) {
    return entries
      .map((e) => {
        const key = e.name.toLowerCase().replace(/\s+/g, "-");
        const dev = e.developer || developerLookup.get(key) || "";
        const score = scoreKey ? (e.scores[scoreKey] ?? 0) : (Object.values(e.scores)[0] ?? 0);
        return {
          name: e.name,
          developer: translateDeveloper(dev),
          score,
          mode: e.mode ? translateMode(e.mode) : undefined,
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  for (const [page, entries] of Object.entries(byPage)) {
    // Single-benchmark pages
    const benchmarkKey = pageToBenchmark[page];
    if (benchmarkKey) {
      benchmarkRankings[benchmarkKey] = buildRankings(entries);
      continue;
    }

    // Multi-benchmark pages
    const multiKeys = multiBenchmarkPages[page];
    if (multiKeys) {
      for (const key of multiKeys) {
        benchmarkRankings[key] = buildRankings(entries, key);
      }
    }
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
