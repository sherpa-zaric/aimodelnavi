/**
 * Process stage: AI rewrite/enrich raw model data into the models table.
 * Reads from raw_models, writes to models.
 * Preserves hand-curated content (is_core=1).
 */

import {
  getDb,
  migrate,
  getSourceId,
  upsertModel,
  getRawModelCount,
} from "../lib/db";
import { extractFromHTML } from "../lib/anthropic";

const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";

// ── Category & License Inference ──

function inferCategory(name: string, description: string): string {
  const lower = (name + " " + description).toLowerCase();
  if (lower.match(/codex|coder|code/i)) return "coder";
  if (lower.match(/reasoning|think|deep.?think|o[0-9]|mythos/i)) return "reasoning";
  if (lower.match(/embed/i)) return "embedding";
  if (lower.match(/image|vision|multimodal|vl-|ocr/i)) return "multimodal";
  if (lower.match(/voice|tts|asr|speech|audio/i)) return "voice";
  return "foundation";
}

function inferLicenseStatus(license?: string): string {
  if (!license) return "closed";
  const lower = license.toLowerCase();
  if (lower.includes("不开源") || lower.includes("proprietary") || lower.includes("プロプライエタリ"))
    return "closed";
  if (lower.includes("mit") || lower.includes("apache") || lower.includes("open source"))
    return "open";
  if (lower.includes("nc") || lower.includes("非商用") || lower.includes("non-commercial"))
    return "open-nc";
  if (lower.includes("llama") || lower.includes("gemma"))
    return "open-nc";
  return "closed";
}

function formatLicense(licenseRaw?: string, licenseStatus?: string): string {
  if (!licenseRaw) return licenseStatus === "open" ? "オープンソース" : "プロプライエタリ";
  const lower = licenseRaw.toLowerCase();
  if (lower.includes("mit")) return "MIT";
  if (lower.includes("apache")) return "Apache 2.0";
  if (lower.includes("llama")) return "Llama License";
  if (lower.includes("gemma")) return "Gemma License";
  if (lower.includes("不开源") || lower.includes("proprietary")) return "プロプライエタリ";
  return licenseRaw;
}

function extractParams(description: string): string | null {
  const match = description.match(/参数规模约为\s*([\d.]+\s*[BKM]?B?)/);
  if (match) return match[1].replace(/\s/g, "");
  return null;
}

function extractContextWindow(description: string): string | null {
  const match = description.match(/上下文长度为\s*([\d.]+\s*[KMB]?)/);
  if (match) return match[1].replace(/\s/g, "");
  return null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── AI Enrichment ──

interface AIEnrichment {
  descriptionJa: string;
  strengths: string[];
  weaknesses: string[];
  useCases: string[];
  params?: string;
  contextWindow?: string;
}

async function enrichWithAI(
  name: string,
  developer: string,
  descriptionZh: string,
  category: string,
  licenseStatus: string,
  releaseDate: string
): Promise<AIEnrichment | null> {
  if (!LLM_API_KEY) return null;

  try {
    const result = await extractFromHTML<AIEnrichment>(
      `モデル名: ${name}
開発者: ${developer}
カテゴリ: ${category}
ライセンス: ${licenseStatus}
リリース日: ${releaseDate}

原文(中国語):
${descriptionZh.slice(0, 800)}`,
      `{
  "descriptionJa": "2-3文の自然な日本語説明",
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱み1", "弱み2", "弱み3"],
  "useCases": ["用途1", "用途2", "用途3"]
}`,
      `あなたはAIモデルアナリストです。上記の中国語のモデル情報を基に、日本のAI比較サイト向けに以下を作成してください：
1. descriptionJa: 自然で専門的な日本語の説明文（2-3文）。モデル名と開発者名は英語のまま。推論モデル→推論モデル、基盤モデル→基盤モデルなど日本語AI用語を使用。
2. strengths: 3つの強み（日本語、各10-20文字）
3. weaknesses: 3つの弱み（日本語、各10-20文字）
4. useCases: 3つの用途（日本語、各10-20文字）

事実を歪めないこと。原文にない情報は推測しないこと。`
    );
    return result;
  } catch (err) {
    console.warn(`  AI enrichment failed for ${name}: ${err}`);
    return null;
  }
}

// ── HuggingFace Processing ──

async function processHuggingFaceModels(
  existingSlugs: Set<string>,
  aiCallCount: { value: number }
): Promise<{ processed: number; skipped: number; errors: number }> {
  const db = getDb();
  const sourceId = getSourceId("huggingface");
  const result = { processed: 0, skipped: 0, errors: 0 };

  const rawModels = db.prepare(`
    SELECT r.id, r.external_id, r.source_url, r.raw_data
    FROM raw_models r
    WHERE r.source_id = ? AND r.is_active = 1
    ORDER BY r.last_seen_at DESC
  `).all(sourceId) as { id: number; external_id: string; source_url: string; raw_data: string }[];

  if (rawModels.length === 0) return result;

  console.log(`\n  [HuggingFace] Processing ${rawModels.length} models...`);

  for (const raw of rawModels) {
    try {
      const data = JSON.parse(raw.raw_data) as Record<string, unknown>;
      const modelId = (data.id as string) || raw.external_id;
      const slug = modelId
        .replace(/^[^/]+\//, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (existingSlugs.has(slug)) {
        db.prepare(
          "UPDATE models SET hf_model_id = ? WHERE slug = ? AND hf_model_id IS NULL"
        ).run(raw.external_id, slug);
        result.skipped++;
        continue;
      }

      const orgInfo = (data as any).org_name || (data.author as string) || "Unknown";
      const orgNameJa = (data as any).org_name_ja || orgInfo;
      const tags = (data.tags as string[]) || [];
      const pipelineTag = data.pipeline_tag as string | null;
      const licenseRaw = data.license as string | undefined;
      const language = data.language as string | string[] | undefined;
      const downloads = data.downloads as number || 0;
      const likes = data.likes as number || 0;
      const createdAt = data.createdAt as string || "";
      const lastModified = data.lastModified as string || "";
      const hfUrl = `https://huggingface.co/${modelId}`;

      // Skip models that are clearly not language models
      const langTags = Array.isArray(language) ? language : language ? [language] : [];
      const isJapaneseRelated = tags.some((t: string) =>
        t.includes("ja") || t.includes("japanese") || t.includes("日本語")
      ) || langTags.includes("ja") || langTags.includes("japanese");

      const category = inferCategoryFromHFTags(tags, pipelineTag);
      const licenseStatus = inferLicenseStatusFromHF(licenseRaw);
      const params = extractParamsFromHFTags(tags);

      // Build links
      const links: Record<string, string> = { huggingface: hfUrl };
      const orgUrl = (data as any).org_url as string | undefined;
      if (orgUrl) links.official = orgUrl;

      // Build description from tags and metadata
      const descriptionParts: string[] = [];
      descriptionParts.push(`${orgNameJa}が開発した${category}モデル。`);
      if (params) descriptionParts.push(`パラメータ数は${params}。`);
      if (isJapaneseRelated) descriptionParts.push(`日本語に最適化された学習が施されている。`);
      descriptionParts.push(`HuggingFaceで${downloads.toLocaleString()}ダウンロード、${likes}いいねを獲得。`);
      const descriptionJa = descriptionParts.join("");

      upsertModel({
        slug,
        name: modelId.replace(/^[^/]+\//, ""),
        developer: orgNameJa,
        developer_url: orgUrl || null,
        params: params || null,
        context_window: null,
        license: inferLicenseFromHF(licenseRaw),
        license_status: licenseStatus,
        category,
        release_date: createdAt ? createdAt.split("T")[0] : (lastModified ? lastModified.split("T")[0] : null),
        description_zh: null,
        description_ja: descriptionJa,
        strengths: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        use_cases: JSON.stringify([]),
        links_json: JSON.stringify(links),
        hf_model_id: raw.external_id,
        is_core: 0,
        is_japanese: isJapaneseRelated ? 1 : 0,
        priority: 0,
      });

      existingSlugs.add(slug);
      result.processed++;
      console.log(`  [HF] ${modelId} (${orgInfo}) - processed`);
    } catch (err) {
      result.errors++;
      console.warn(`  [HF] ${raw.external_id}: processing failed - ${err}`);
    }
  }

  return result;
}

function inferCategoryFromHFTags(tags: string[], pipelineTag: string | null): string {
  const lower = tags.join(" ").toLowerCase() + " " + (pipelineTag || "").toLowerCase();
  if (lower.match(/code|codex|coder/)) return "coder";
  if (lower.match(/reasoning|think/)) return "reasoning";
  if (lower.match(/embed|embedding/)) return "embedding";
  if (lower.match(/image|vision|multimodal|vl-|ocr/)) return "multimodal";
  if (lower.match(/audio|tts|asr|speech|voice/)) return "voice";
  return "foundation";
}

function inferLicenseStatusFromHF(license?: string): string {
  if (!license) return "closed";
  const lower = license.toLowerCase();
  if (lower.includes("mit") || lower.includes("apache") || lower.includes("cc-by") || lower.includes("cc0") || lower.includes("bsd"))
    return "open";
  if (lower.includes("llama") || lower.includes("gemma") || lower.includes("nc") || lower.includes("non-commercial"))
    return "open-nc";
  return "closed";
}

function inferLicenseFromHF(license?: string): string {
  if (!license) return "プロプライエタリ";
  const lower = license.toLowerCase();
  if (lower.includes("mit")) return "MIT";
  if (lower.includes("apache")) return "Apache 2.0";
  if (lower.includes("llama")) return "Llama License";
  if (lower.includes("gemma")) return "Gemma License";
  if (lower.includes("cc-by")) return "CC BY";
  if (lower.includes("cc0")) return "CC0";
  if (lower.includes("bsd")) return "BSD";
  return license;
}

function extractParamsFromHFTags(tags: string[]): string | null {
  for (const tag of tags) {
    const match = tag.match(/^(\d+\.?\d*[bmk])$/i);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

// ── Main Process Function ──

export interface ProcessResult {
  processed: number;
  skipped: number;
  errors: number;
}

export async function processModels(): Promise<ProcessResult> {
  migrate();
  const db = getDb();
  const sourceId = getSourceId("datalearner");

  console.log("\n═══ Stage 2: Process ═══");

  // Get all raw models that haven't been processed yet
  const rawModels = db.prepare(`
    SELECT r.id, r.external_id, r.source_url, r.raw_data
    FROM raw_models r
    WHERE r.source_id = ? AND r.is_active = 1
    ORDER BY r.last_seen_at DESC
  `).all(sourceId) as { id: number; external_id: string; source_url: string; raw_data: string }[];

  // Get existing model slugs
  const existingSlugs = new Set(
    (db.prepare("SELECT slug FROM models").all() as { slug: string }[]).map((r) => r.slug)
  );

  const result: ProcessResult = { processed: 0, skipped: 0, errors: 0 };
  let aiCallCount = 0;

  for (const raw of rawModels) {
    try {
      const app = JSON.parse(raw.raw_data) as Record<string, unknown>;
      const name = (app.name as string) || raw.external_id;
      const slug = slugify(name);

      // Skip if already processed (unless re-processing is needed)
      if (existingSlugs.has(slug)) {
        // Update datalearner_slug if missing
        db.prepare(
          "UPDATE models SET datalearner_slug = ? WHERE slug = ? AND datalearner_slug IS NULL"
        ).run(raw.external_id, slug);
        result.skipped++;
        continue;
      }

      const developer = (app.author as any)?.name || "Unknown";
      const descriptionZh = (app.description as string) || "";
      const releaseDate = (app.datePublished as string) || "";
      const licenseRaw = app.license as string | undefined;
      const licenseStatus = inferLicenseStatus(licenseRaw);
      const category = inferCategory(name, descriptionZh);
      const params = extractParams(descriptionZh);
      const contextWindow = extractContextWindow(descriptionZh);
      const sameAs = (app.sameAs as string[]) || [];
      const offers = app.offers as { price?: string; priceCurrency?: string; url?: string } | undefined;

      // Build links from sameAs
      const links: Record<string, string> = {};
      for (const url of sameAs) {
        if (url.includes("huggingface.co")) links.huggingface = url;
        else if (url.includes("anthropic.com") || url.includes("openai.com") || url.includes("deepmind.google") || url.includes("ai.google.dev") || url.includes("x.ai") || url.includes("deepseek.com") || url.includes("chat.deepseek.com"))
          links.official = url;
        else if (url.endsWith(".pdf")) links.paper = url;
        else links.official = links.official || url;
      }

      // Build pricing
      const pricingJson =
        offers?.price
          ? JSON.stringify({
              inputPer1M: parseFloat(offers.price) || null,
              outputPer1M: null,
              currency: offers.priceCurrency || "USD",
              billingMode: "標準",
              url: offers.url || null,
            })
          : null;

      // AI enrichment
      let enrichment: AIEnrichment | null = null;
      if (LLM_API_KEY && descriptionZh.length > 20) {
        // Rate limit AI calls: batch every 15 models
        if (aiCallCount > 0 && aiCallCount % 15 === 0) {
          console.log("  (AI rate limit pause: 1s)");
          await new Promise((r) => setTimeout(r, 1000));
        }
        enrichment = await enrichWithAI(
          name,
          developer,
          descriptionZh,
          category,
          licenseStatus,
          releaseDate
        );
        aiCallCount++;
      }

      // Fallback description
      const descriptionJa =
        enrichment?.descriptionJa ||
        `${developer}の${category}モデル。`;

      const strengths = enrichment?.strengths || [];
      const weaknesses = enrichment?.weaknesses || [];
      const useCases = enrichment?.useCases || [];

      // Determine developer URL
      const developerUrl = sameAs.find((u) =>
        u.includes("anthropic.com") || u.includes("openai.com") || u.includes("deepmind.google") || u.includes("deepseek.com") || u.includes("x.ai")
      ) || null;

      upsertModel({
        slug,
        name,
        developer,
        developer_url: developerUrl,
        params: params || null,
        context_window: contextWindow || null,
        license: formatLicense(licenseRaw, licenseStatus),
        license_status: licenseStatus,
        category,
        release_date: releaseDate || null,
        description_zh: descriptionZh.slice(0, 500),
        description_ja: descriptionJa,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        use_cases: JSON.stringify(useCases),
        links_json: JSON.stringify(links),
        datalearner_slug: raw.external_id,
        pricing_json: pricingJson,
        is_core: 0,
        is_japanese: 0,
        priority: 0,
      });

      existingSlugs.add(slug);
      result.processed++;
      console.log(`  ${name} (${developer}) - processed`);
    } catch (err) {
      result.errors++;
      console.warn(`  ${raw.external_id}: processing failed - ${err}`);
    }
  }

  console.log(
    `  Done: ${result.processed} processed, ${result.skipped} skipped, ${result.errors} errors`
  );

  // Process HuggingFace models
  const hfResult = await processHuggingFaceModels(existingSlugs, { value: aiCallCount });

  console.log(
    `  [HF] ${hfResult.processed} processed, ${hfResult.skipped} skipped, ${hfResult.errors} errors`
  );

  result.processed += hfResult.processed;
  result.skipped += hfResult.skipped;
  result.errors += hfResult.errors;

  console.log(
    `  Total: ${result.processed} processed, ${result.skipped} skipped, ${result.errors} errors`
  );

  return result;
}