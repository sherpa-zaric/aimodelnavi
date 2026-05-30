/**
 * Generate TypeScript data files from the SQLite database.
 * Output files must be compatible with existing website page imports.
 */

import { getDb, migrate } from "../lib/db";
import { saveDataFile } from "../lib/storage";

export interface GenerateResult {
  modelsGenerated: number;
  filesWritten: string[];
}

interface ModelRow {
  slug: string;
  name: string;
  alternate_name: string | null;
  developer: string;
  developer_url: string | null;
  developer_logo_url: string | null;
  params: string | null;
  context_window: string | null;
  license: string | null;
  license_status: string;
  category: string | null;
  release_date: string | null;
  description_zh: string | null;
  description_ja: string | null;
  strengths: string | null;
  weaknesses: string | null;
  use_cases: string | null;
  links_json: string | null;
  hf_model_id: string | null;
  datalearner_slug: string | null;
  pricing_json: string | null;
  is_core: number;
  is_japanese: number;
  priority: number;
}

function parseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// Translate Chinese developer/provider names to Japanese
const developerJaMap: Record<string, string> = {
  "阿里巴巴": "アリババ",
  "智谱AI": "Zhipu AI",
  "百度": "バイドゥ",
  "腾讯AI实验室": "テンセントAI研究所",
  "华为": "ファーウェイ",
  "亚马逊": "アマゾン",
  "上海人工智能实验室": "上海人工知能研究所",
  "普林斯顿大学": "プリンストン大学",
  "Facebook AI研究实验室": "Meta AI",
  "DeepSeek-AI": "DeepSeek",
  "小米": "Xiaomi",
  "字节跳动": "ByteDance",
  "字节跳动Seed团队": "ByteDance Seed",
  "网易": "NetEase",
  "科大讯飞": "iFlytek",
  "商汤": "SenseTime",
  "旷视": "Megvii",
  "百川智能": "Baichuan AI",
  "元象XVERSE": "XVERSE",
  "昆仑万维": "Kunlun Tech",
  "富士通": "富士通",
  "个人": "個人",
};

// Translate developer names to English for EN locale
const developerEnMap: Record<string, string> = {
  "阿里巴巴": "Alibaba",
  "アリババ": "Alibaba",
  "智谱AI": "Zhipu AI",
  "百度": "Baidu",
  "バイドゥ": "Baidu",
  "腾讯AI实验室": "Tencent AI Lab",
  "テンセントAI研究所": "Tencent AI Lab",
  "华为": "Huawei",
  "ファーウェイ": "Huawei",
  "亚马逊": "Amazon",
  "アマゾン": "Amazon",
  "上海人工智能实验室": "Shanghai AI Lab",
  "上海人工知能研究所": "Shanghai AI Lab",
  "普林斯顿大学": "Princeton University",
  "プリンストン大学": "Princeton University",
  "Facebook AI研究实验室": "Meta AI",
  "DeepSeek-AI": "DeepSeek",
  "小米": "Xiaomi",
  "字节跳动": "ByteDance",
  "字节跳动Seed团队": "ByteDance Seed",
  "网易": "NetEase",
  "科大讯飞": "iFlytek",
  "商汤": "SenseTime",
  "旷视": "Megvii",
  "百川智能": "Baichuan AI",
  "元象XVERSE": "XVERSE",
  "昆仑万维": "Kunlun Tech",
  "富士通": "Fujitsu",
  "个人": "Individual",
  "個人": "Individual",
};

function translateDeveloper(dev: string): string {
  return developerJaMap[dev] || dev;
}

function translateDeveloperEn(dev: string): string {
  // Try Japanese name first, then original
  return developerEnMap[dev] || dev;
}

export function generateDataFiles(): GenerateResult {
  migrate();
  const db = getDb();

  console.log("\n═══ Stage 4: Generate ═══");

  const models = db.prepare(
    `SELECT m.*,
      mt_en.translated_text as description_en,
      mt_s.translated_text as strengths_en,
      mt_w.translated_text as weaknesses_en,
      mt_u.translated_text as use_cases_en,
      pe.input_price as pe_input_price,
      pe.output_price as pe_output_price,
      pe.currency as pe_currency,
      pe.source_url as pe_source_url,
      pe.billing_mode as pe_billing_mode
    FROM models m
    LEFT JOIN model_translations mt_en ON mt_en.model_id = m.id
      AND mt_en.language = 'en' AND mt_en.field_name = 'description'
    LEFT JOIN model_translations mt_s ON mt_s.model_id = m.id
      AND mt_s.language = 'en' AND mt_s.field_name = 'strengths'
    LEFT JOIN model_translations mt_w ON mt_w.model_id = m.id
      AND mt_w.language = 'en' AND mt_w.field_name = 'weaknesses'
    LEFT JOIN model_translations mt_u ON mt_u.model_id = m.id
      AND mt_u.language = 'en' AND mt_u.field_name = 'use_cases'
    LEFT JOIN (
      SELECT model_id, input_price, output_price, currency, source_url, billing_mode,
        ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY output_price DESC, updated_at DESC) as rn
      FROM pricing_entries
      WHERE billing_mode = 'standard' AND model_id IS NOT NULL
    ) pe ON pe.model_id = m.id AND pe.rn = 1
    ORDER BY m.priority DESC, m.is_japanese ASC, m.release_date DESC NULLS LAST, m.name`
  ).all() as ModelRow[];

  // Generate src/data/models.ts
  const modelEntries = models.map((m) => {
    const links = parseJSON<Record<string, string>>(m.links_json, {});
    // Prefer pricing_entries (scraped from provider pages) over models.pricing_json (DataLearner)
    let pricing: {
      inputPer1M: number | null;
      outputPer1M: number | null;
      currency: string;
      billingMode: string;
      url: string | null;
    } | null = null;
    const peInput = (m as any).pe_input_price as number | null;
    const peOutput = (m as any).pe_output_price as number | null;
    if (peInput != null) {
      pricing = {
        inputPer1M: peInput,
        outputPer1M: peOutput && peOutput > 0 ? peOutput : null,
        currency: (m as any).pe_currency || "USD",
        billingMode: (m as any).pe_billing_mode || "standard",
        url: (m as any).pe_source_url || null,
      };
    } else {
      pricing = parseJSON<{
        inputPer1M: number | null;
        outputPer1M: number | null;
        currency: string;
        billingMode: string;
        url: string | null;
      } | null>(m.pricing_json, null);
    }
    const strengths = parseJSON<string[]>(m.strengths, []);
    const weaknesses = parseJSON<string[]>(m.weaknesses, []);
    const useCases = parseJSON<string[]>(m.use_cases, []);
    const strengthsEn = parseJSON<string[]>((m as any).strengths_en, []);
    const weaknessesEn = parseJSON<string[]>((m as any).weaknesses_en, []);
    const useCasesEn = parseJSON<string[]>((m as any).use_cases_en, []);

    // Map category to the type field expected by the website
    const typeMap: Record<string, string> = {
      reasoning: "reasoning",
      foundation: "foundation",
      chat: "chat",
      coder: "coder",
      embedding: "foundation",
      multimodal: "foundation",
      voice: "foundation",
    };
    const type = typeMap[m.category || "foundation"] || "foundation";

    return `  {
    slug: "${escapeStr(m.slug)}",
    name: "${escapeStr(m.name)}",
    developer: "${escapeStr(translateDeveloper(m.developer))}",
    developerEn: "${escapeStr(translateDeveloperEn(m.developer))}",
    developerUrl: "${escapeStr(m.developer_url || "")}",
    params: "${escapeStr(m.params || "非公開")}",
    contextWindow: "${escapeStr(m.context_window || "")}",
    license: "${escapeStr(m.license || "プロプライエタリ")}",
    openSource: "${m.license_status}" as const,
    type: "${type}" as const,
    releaseDate: "${escapeStr(m.release_date || "")}",
    pricing: ${pricing ? `{
      inputPer1M: ${pricing.inputPer1M ?? "null"},
      outputPer1M: ${pricing.outputPer1M ?? "null"},
      currency: "${pricing.currency}" as const,
      billingMode: "${escapeStr(pricing.billingMode)}",
      url: ${pricing.url ? `"${escapeStr(pricing.url)}"` : "null"},
    }` : "null"},
    descriptionJa: "${escapeStr(m.description_ja || "")}",
    descriptionEn: "${escapeStr(m.description_en || "")}",
    strengths: ${JSON.stringify(strengths)},
    strengthsEn: ${JSON.stringify(strengthsEn)},
    weaknesses: ${JSON.stringify(weaknesses)},
    weaknessesEn: ${JSON.stringify(weaknessesEn)},
    useCases: ${JSON.stringify(useCases)},
    useCasesEn: ${JSON.stringify(useCasesEn)},
    links: {
      ${links.official ? `official: "${escapeStr(links.official)}",` : ""}
      ${links.huggingface ? `huggingface: "${escapeStr(links.huggingface)}",` : ""}
      ${links.paper ? `paper: "${escapeStr(links.paper)}",` : ""}
      ${links.api ? `api: "${escapeStr(links.api)}",` : ""}
    },
  }`;
  });

  const modelsTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}
// Source: SQLite database (data/crawler.db)
// DO NOT EDIT MANUALLY

export interface ModelDetail {
  slug: string;
  name: string;
  developer: string;
  developerEn: string;
  developerUrl: string;
  params: string;
  contextWindow: string;
  license: string;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  releaseDate: string;
  pricing: {
    inputPer1M: number | null;
    outputPer1M: number | null;
    currency: "USD" | "JPY";
    billingMode: string;
    url: string | null;
  } | null;
  descriptionJa: string;
  descriptionEn: string;
  strengths: string[];
  strengthsEn: string[];
  weaknesses: string[];
  weaknessesEn: string[];
  useCases: string[];
  useCasesEn: string[];
  links: {
    official?: string;
    huggingface?: string;
    paper?: string;
    api?: string;
  };
}

export const modelDetails: ModelDetail[] = [
${modelEntries.join(",\n")}
];

export function getModelBySlug(slug: string): ModelDetail | undefined {
  return modelDetails.find((m) => m.slug === slug);
}
`;

  saveDataFile("models.ts", modelsTs);

  // Generate src/data/model-analyses.ts from model_analyses table
  const analysesEn = db.prepare(
    `SELECT ma.*, m.slug FROM model_analyses ma JOIN models m ON m.id = ma.model_id WHERE ma.language = 'en'`
  ).all() as any[];

  const analysesJa = db.prepare(
    `SELECT ma.*, m.slug FROM model_analyses ma JOIN models m ON m.id = ma.model_id WHERE ma.language = 'ja'`
  ).all() as any[];

  // Fix literal \\n (backslash-n text) that LLMs sometimes produce in JSON strings.
  // After JSON.parse these become the two characters \ and n instead of actual newlines.
  function fixEscapedNewlines(s: string | null): string {
    if (!s) return "";
    // Replace literal \n (two chars: backslash + n) with actual newline
    return s.replace(/\\n/g, "\n");
  }

  const buildAnalysisEntry = (a: any) => {
    const rawCompetitors = parseJSON<any[]>(a.competitors_json, []);
    const normalizedCompetitors = rawCompetitors.map((c: any) => ({
      name: c.name,
      arena: c.arena,
      swe: c.swe || c.swe_verified || c.swe_bench || c.sweBench || undefined,
      gpqa: c.gpqa || c.gpqa_diamond || undefined,
      price: c.price || undefined,
    }));

    return {
    keyMetrics: parseJSON<{ label: string; value: string; context?: string }[]>(a.key_metrics_json, []),
    pros: parseJSON<string[]>(a.pros_json, []),
    cons: parseJSON<string[]>(a.cons_json, []),
    competitorTable: normalizedCompetitors,
    summary: fixEscapedNewlines(a.summary),
    performance: fixEscapedNewlines(a.performance),
    comparisons: fixEscapedNewlines(a.comparisons),
    community: fixEscapedNewlines(a.community),
    useCaseDeep: fixEscapedNewlines(a.use_case_deep),
    latestNews: fixEscapedNewlines(a.latest_news),
    sources: parseJSON<{ title: string; url: string }[]>(a.sources_json, []),
    generatedAt: a.generated_at,
    };
  };

  const analysisEnMap: Record<string, any> = {};
  for (const a of analysesEn) analysisEnMap[a.slug] = buildAnalysisEntry(a);

  const analysisJaMap: Record<string, any> = {};
  for (const a of analysesJa) analysisJaMap[a.slug] = buildAnalysisEntry(a);

  const analysesTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}

export interface KeyMetric {
  label: string;
  value: string;
  context?: string;
}

export interface CompetitorRow {
  name: string;
  arena?: string;
  swe?: string;
  gpqa?: string;
  price?: string;
}

export interface ModelAnalysis {
  keyMetrics: KeyMetric[];
  pros: string[];
  cons: string[];
  competitorTable: CompetitorRow[];
  summary: string;
  performance: string;
  comparisons: string;
  community: string;
  useCaseDeep: string;
  latestNews: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

export const modelAnalysesEn: Record<string, ModelAnalysis> = ${JSON.stringify(analysisEnMap, null, 2)};
export const modelAnalysesJa: Record<string, ModelAnalysis> = ${JSON.stringify(analysisJaMap, null, 2)};

export function getModelAnalysis(slug: string, locale: string = 'ja'): ModelAnalysis | undefined {
  if (locale === 'en') return modelAnalysesEn[slug] || modelAnalysesJa[slug];
  return modelAnalysesJa[slug] || modelAnalysesEn[slug];
}
`;
  saveDataFile("model-analyses.ts", analysesTs);

  // Generate src/data/model-slugs.ts for generateStaticParams
  const slugs = models.map((m) => m.slug);
  const slugsTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}

export const allModelSlugs: string[] = ${JSON.stringify(slugs, null, 2)};
`;
  saveDataFile("model-slugs.ts", slugsTs);

  // Generate pricing.ts from pricing_entries table
  // NOTE: leaderboard.ts is generated separately by generate-leaderboard-data.ts
  // (reads from raw_models → DataLearner data, ~656 models with 17 benchmarks)
  // The leaderboard_scores table is not used — LMSYS/HF sync is unreliable.
  generatePricingFile(db);

  // Generate value-ranking.ts and jp-capability.ts
  generateValueRankingFile(db);
  generateJpCapabilityFile(db);

  console.log(`  Generated ${models.length} models in models.ts and model-slugs.ts`);

  return {
    modelsGenerated: models.length,
    filesWritten: ["src/data/models.ts", "src/data/model-slugs.ts", "src/data/leaderboard.ts", "src/data/pricing.ts", "src/data/value-ranking.ts", "src/data/jp-capability.ts"],
  };
}

// ── Leaderboard generation ──

interface LeaderboardRow {
  id: number;
  name: string;
  developer: string;
  license_status: string;
  category: string | null;
  release_date: string | null;
}

interface ScoreRow {
  model_id: number;
  benchmark: string;
  score: number;
}

function generateLeaderboardFile(db: ReturnType<typeof getDb>): void {
  console.log("  Generating leaderboard.ts...");

  // Get all models that have at least one leaderboard score
  const modelsWithScores = db.prepare(`
    SELECT DISTINCT m.id, m.name, m.developer, m.license_status, m.category, m.release_date
    FROM models m
    INNER JOIN leaderboard_scores ls ON ls.model_id = m.id
    ORDER BY m.name
  `).all() as LeaderboardRow[];

  if (modelsWithScores.length === 0) {
    console.log("  No leaderboard scores in DB, skipping leaderboard.ts generation");
    return;
  }

  // Get all scores
  const allScores = db.prepare("SELECT model_id, benchmark, score FROM leaderboard_scores").all() as ScoreRow[];

  // Build score map: model_id -> { benchmark: score }
  const scoreMap = new Map<number, Record<string, number>>();
  for (const s of allScores) {
    if (!scoreMap.has(s.model_id)) scoreMap.set(s.model_id, {});
    scoreMap.get(s.model_id)![s.benchmark] = s.score;
  }

  // Build ranking entries
  const typeMap: Record<string, string> = {
    reasoning: "reasoning",
    foundation: "foundation",
    chat: "chat",
    coder: "coder",
    embedding: "foundation",
    multimodal: "foundation",
    voice: "foundation",
  };

  const entries = modelsWithScores.map((m) => {
    const scores = scoreMap.get(m.id) || {};
    return {
      name: m.name,
      developer: m.developer,
      hle: scores.hle ?? null,
      arcAgi2: scores.arcAgi2 ?? null,
      frontierMath: scores.frontierMath ?? null,
      sweBenchVerified: scores.sweBenchVerified ?? null,
      tauBench: scores.tauBench ?? null,
      openSource: m.license_status as "open" | "closed" | "open-nc",
      type: (typeMap[m.category || "foundation"] || "foundation") as "reasoning" | "foundation" | "chat" | "coder",
      releaseDate: m.release_date || "",
    };
  });

  // Sort by HLE descending, then by name
  entries.sort((a, b) => {
    const aHle = a.hle ?? 0;
    const bHle = b.hle ?? 0;
    if (bHle !== aHle) return bHle - aHle;
    return a.name.localeCompare(b.name);
  });

  // Add rank
  const ranked = entries.map((e, i) => ({ rank: i + 1, ...e }));

  const data = JSON.stringify(ranked, null, 2);

  const leaderboardTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}
// Source: SQLite database (leaderboard_scores table)
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

  saveDataFile("leaderboard.ts", leaderboardTs);
  console.log(`  Generated ${ranked.length} leaderboard entries`);
}

// ── Pricing generation ──

interface PricingRow {
  model_name: string;
  provider: string;
  billing_mode: string;
  input_price: number;
  output_price: number;
  input_modality: string;
  output_modality: string;
  currency: string | null;
  notes: string | null;
  release_date: string | null;
}

function generatePricingFile(db: ReturnType<typeof getDb>): void {
  console.log("  Generating pricing.ts...");

  const entries = db.prepare(`
    SELECT p.model_name, p.provider, p.billing_mode, p.input_price, p.output_price,
           p.input_modality, p.output_modality, p.currency, p.notes,
           m.release_date
    FROM pricing_entries p
    LEFT JOIN models m ON p.model_id = m.id
    ORDER BY p.provider, p.model_name, p.billing_mode
  `).all() as PricingRow[];

  if (entries.length === 0) {
    console.log("  No pricing entries in DB, skipping pricing.ts generation");
    return;
  }

  const outputEntries = entries.map((e) => ({
    modelName: e.model_name,
    provider: translateDeveloper(e.provider),
    billingMode: e.billing_mode,
    inputPrice: e.input_price,
    outputPrice: e.output_price,
    inputModality: e.input_modality,
    outputModality: e.output_modality,
    releaseDate: e.release_date || new Date().toISOString().slice(0, 10),
    ...(e.notes ? { notes: e.notes } : {}),
  }));

  const data = JSON.stringify(outputEntries, null, 2);

  const pricingTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}
// Source: SQLite database (pricing_entries table)
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

  saveDataFile("pricing.ts", pricingTs);
  console.log(`  Generated ${entries.length} pricing entries`);
}

// ── Value ranking generation ──

interface ValueRankingRow {
  slug: string;
  name: string;
  developer: string;
  developer_en: string;
  open_source: string;
  category: string;
  input_price: number | null;
  output_price: number | null;
}

function generateValueRankingFile(db: ReturnType<typeof getDb>): void {
  console.log("  Generating value-ranking.ts...");

  // Cross-reference models with leaderboard scores and pricing
  const rows = db.prepare(`
    SELECT m.slug, m.name, m.developer,
      COALESCE(mt.translated_text, m.developer) as developer_en,
      m.license_status as open_source, m.category,
      pe.input_price, pe.output_price
    FROM models m
    INNER JOIN leaderboard_scores ls ON ls.model_id = m.id
    LEFT JOIN model_translations mt ON mt.model_id = m.id
      AND mt.language = 'en' AND mt.field_name = 'developer'
    LEFT JOIN (
      SELECT model_id, input_price, output_price,
        ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY output_price DESC, updated_at DESC) as rn
      FROM pricing_entries
      WHERE billing_mode = 'standard' AND model_id IS NOT NULL
    ) pe ON pe.model_id = m.id AND pe.rn = 1
    WHERE m.is_core = 1
    GROUP BY m.id
    ORDER BY m.name
  `).all() as ValueRankingRow[];

  if (rows.length === 0) {
    console.log("  No value-ranking data, skipping");
    return;
  }

  // Get all scores for composite calculation
  const allScores = db.prepare(`
    SELECT m.slug, ls.benchmark, ls.score
    FROM leaderboard_scores ls
    JOIN models m ON m.id = ls.model_id
    WHERE m.is_core = 1
  `).all() as { slug: string; benchmark: string; score: number }[];

  const scoreMap = new Map<string, Record<string, number>>();
  for (const s of allScores) {
    if (!scoreMap.has(s.slug)) scoreMap.set(s.slug, {});
    scoreMap.get(s.slug)![s.benchmark] = s.score;
  }

  // Benchmark weights for composite score
  const weights: Record<string, number> = {
    hle: 0.25,
    sweBenchVerified: 0.20,
    gpqaDiamond: 0.15,
    aime2025: 0.15,
    elo: 0.15,
    mmluPro: 0.10,
  };

  const typeMap: Record<string, string> = {
    reasoning: "reasoning", foundation: "foundation", chat: "chat", coder: "coder",
    embedding: "foundation", multimodal: "foundation", voice: "foundation",
  };

  const entries = rows
    .filter((r) => r.input_price != null && r.output_price != null)
    .map((r) => {
      const scores = scoreMap.get(r.slug) || {};

      // Compute weighted composite score (redistribute weights among available benchmarks)
      let totalWeight = 0;
      let weightedSum = 0;
      for (const [key, weight] of Object.entries(weights)) {
        const val = scores[key];
        if (typeof val === "number" && val > 0) {
          weightedSum += val * weight;
          totalWeight += weight;
        }
      }
      const compositeScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;

      // Blended cost: (input + 2*output) / 3
      const blendedCost = (r.input_price + 2 * r.output_price) / 3;
      const valueScore = compositeScore != null && blendedCost > 0
        ? Math.round((compositeScore / blendedCost) * 100) / 100
        : null;

      return {
        name: r.name,
        developer: translateDeveloper(r.developer),
        slug: r.slug,
        openSource: r.open_source as "open" | "closed" | "open-nc",
        type: (typeMap[r.category || "foundation"] || "foundation") as "reasoning" | "foundation" | "chat" | "coder",
        compositeScore,
        inputPrice: r.input_price,
        outputPrice: r.output_price,
        valueScore,
        hle: scores.hle ?? null,
        sweBenchVerified: scores.sweBenchVerified ?? null,
        gpqaDiamond: scores.gpqaDiamond ?? null,
      };
    })
    .filter((e) => e.valueScore != null)
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));

  const data = JSON.stringify(entries, null, 2);

  const valueTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}
// Source: Cross-reference of leaderboard_scores + pricing_entries
// DO NOT EDIT MANUALLY

export interface ValueRankedModel {
  name: string;
  developer: string;
  slug: string;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  compositeScore: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  valueScore: number | null;
  hle: number | null;
  sweBenchVerified: number | null;
  gpqaDiamond: number | null;
}

export const valueRankingData: ValueRankedModel[] = ${data};
`;

  saveDataFile("value-ranking.ts", valueTs);
  console.log(`  Generated ${entries.length} value-ranked entries`);
}

// ── JP capability generation ──

type JpCapabilityLevel = "native" | "high" | "moderate" | "low" | "untested";

interface JpCapabilityRow {
  slug: string;
  name: string;
  developer: string;
  developer_en: string;
  is_japanese: number;
  category: string | null;
}

const japaneseDevelopers = [
  "PFN", "Preferred Networks", "Sakana AI", "Sakana", "ELYZA", "rinna",
  "NTT", "富士通", "Fujitsu", "Preferred",
];

const highJpDevelopers = [
  "Alibaba", "Alibaba Cloud", "Baidu", "Google", "OpenAI", "Anthropic",
  "Meta", "Microsoft", "xAI", "DeepSeek", "ByteDance", "Zhipu",
];

const highJpNamePatterns = ["qwen", "gemini", "gpt-4", "gpt-5", "claude", "mistral", "deepseek"];

function classifyJpLevel(model: JpCapabilityRow): JpCapabilityLevel {
  // Native: Japanese companies or explicitly Japanese models
  if (model.is_japanese === 1) return "native";
  if (japaneseDevelopers.some((d) => model.developer.includes(d) || model.developer_en.includes(d))) {
    return "native";
  }

  // High: known strong multilingual models
  if (highJpDevelopers.some((d) => model.developer.includes(d))) {
    return "high";
  }
  if (highJpNamePatterns.some((p) => model.name.toLowerCase().includes(p))) {
    return "high";
  }

  // Moderate: other models with some multilingual capability
  return "moderate";
}

function generateJpCapabilityFile(db: ReturnType<typeof getDb>): void {
  console.log("  Generating jp-capability.ts...");

  const rows = db.prepare(`
    SELECT m.slug, m.name, m.developer,
      COALESCE(mt.translated_text, m.developer) as developer_en,
      m.is_japanese, m.category
    FROM models m
    LEFT JOIN model_translations mt ON mt.model_id = m.id
      AND mt.language = 'en' AND mt.field_name = 'developer'
    WHERE m.is_core = 1
    ORDER BY m.is_japanese DESC, m.name
  `).all() as JpCapabilityRow[];

  if (rows.length === 0) {
    console.log("  No JP capability data, skipping");
    return;
  }

  const badgeMap: Record<JpCapabilityLevel, { ja: string; en: string }> = {
    native: { ja: "ネイティブJP", en: "Native JP" },
    high: { ja: "高品質日本語", en: "High-Quality JP" },
    moderate: { ja: "多言語対応", en: "Multilingual" },
    low: { ja: "限定的日本語", en: "Limited JP" },
    untested: { ja: "未検証", en: "Untested" },
  };

  const descriptionMap: Record<JpCapabilityLevel, { ja: string; en: string }> = {
    native: {
      ja: "日本企業が開発したモデルまたは日本語に特化したモデル。日本語の理解・生成能力が最も高い。",
      en: "Model developed by a Japanese company or specialized for Japanese. Highest Japanese understanding and generation capability.",
    },
    high: {
      ja: "多言語対応モデルのうち、日本語処理に優れた性能を持つモデル。",
      en: "Multilingual model with strong Japanese language processing capabilities.",
    },
    moderate: {
      ja: "一般的な多言語対応モデル。基本的な日本語処理は可能だが、特化モデルには劣る。",
      en: "General multilingual model. Basic Japanese processing is possible, but inferior to specialized models.",
    },
    low: {
      ja: "日本語サポートが限定的なモデル。",
      en: "Model with limited Japanese support.",
    },
    untested: {
      ja: "日本語性能の検証データがないモデル。",
      en: "Model without verified Japanese performance data.",
    },
  };

  const entries = rows.map((r) => {
    const level = classifyJpLevel(r);
    return {
      slug: r.slug,
      name: r.name,
      developer: translateDeveloper(r.developer),
      jpLevel: level,
      badgeJa: badgeMap[level].ja,
      badgeEn: badgeMap[level].en,
      japaneseMtBench: null as number | null,
      jglue: null as number | null,
      jmmlu: null as number | null,
      descriptionJa: descriptionMap[level].ja,
      descriptionEn: descriptionMap[level].en,
    };
  });

  const data = JSON.stringify(entries, null, 2);

  const jpTs = `// Auto-generated by pipeline/generate-data-files.ts
// Last updated: ${new Date().toISOString()}
// Source: Models table (is_japanese, developer, category)
// DO NOT EDIT MANUALLY

export type JpCapabilityLevel = "native" | "high" | "moderate" | "low" | "untested";

export interface JpCapability {
  slug: string;
  name: string;
  developer: string;
  jpLevel: JpCapabilityLevel;
  badgeJa: string;
  badgeEn: string;
  japaneseMtBench: number | null;
  jglue: number | null;
  jmmlu: number | null;
  descriptionJa: string;
  descriptionEn: string;
}

export const jpCapabilityData: JpCapability[] = ${data};

export function getJpCapabilityBySlug(slug: string): JpCapability | undefined {
  return jpCapabilityData.find((c) => c.slug === slug);
}
`;

  saveDataFile("jp-capability.ts", jpTs);
  console.log(`  Generated ${entries.length} JP capability entries`);
}

// Allow direct execution
if (process.argv[1]?.endsWith("generate-data-files.ts")) {
  const { migrate } = require("../lib/db");
  migrate();
  generateDataFiles();
}