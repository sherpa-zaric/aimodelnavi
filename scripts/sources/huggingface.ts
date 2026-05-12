/**
 * HuggingFace API crawler for Japanese domestic AI models.
 *
 * Uses the HuggingFace REST API to fetch model metadata for
 * known Japanese AI organizations. No scraping needed - pure JSON API.
 *
 * API docs: https://huggingface.co/docs/hub/api
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
import { fetchJson } from "../lib/http";

const HF_API_BASE = "https://huggingface.co/api";

// Japanese AI organizations on HuggingFace
const JAPANESE_ORGS: Record<string, { name: string; nameJa: string; url: string }> = {
  "pfnet": { name: "Preferred Networks", nameJa: "Preferred Networks", url: "https://www.preferred.jp" },
  "sakana-ai": { name: "Sakana AI", nameJa: "Sakana AI", url: "https://sakana.ai" },
  "elyza": { name: "ELYZA", nameJa: "ELYZA", url: "https://www.elyza.ai" },
  "rinna": { name: "rinna", nameJa: "rinna", url: "https://rinna.co.jp" },
  "llm-jp": { name: "LLM-jp", nameJa: "LLM-jp（NII）", url: "https://llm-jp.nii.ac.jp" },
  "cyberagent": { name: "CyberAgent", nameJa: "サイバーエージェント", url: "https://www.cyberagent.co.jp" },
  "stabilityai": { name: "Stability AI Japan", nameJa: "Stability AI Japan", url: "https://stability.ai" },
  "stockmark": { name: "Stockmark", nameJa: "ストックマーク", url: "https://stockmark.co.jp" },
  "nttcslab": { name: "NTT CSLab", nameJa: "NTT", url: "https://www.ntt.co.jp" },
  "line-corporation": { name: "LINE Corporation", nameJa: "LY Corporation", url: "https://linecorp.com" },
  "abeja": { name: "ABEJA", nameJa: "ABEJA", url: "https://abeja.asia" },
};

// ── HuggingFace API Types ──

interface HFModel {
  _id: string;
  id: string; // e.g. "pfnet/plamo-2.0"
  modelId: string;
  author: string;
  sha: string;
  lastModified: string;
  tags: string[];
  pipeline_tag: string | null; // e.g. "text-generation", "text2text-generation"
  downloads: number;
  likes: number;
  private: boolean;
  gated: boolean;
  library_name: string | null;
  createdAt: string;
  card_data?: {
    language?: string[] | string;
    license?: string;
    model_type?: string;
    tags?: string[];
  };
}

interface HFModelListResponse {
  items: HFModel[];
  numTotalRows: number;
}

// ── Category & License Mapping ──

function inferCategoryFromHF(tags: string[], pipelineTag: string | null): string {
  const lower = (tags || []).join(" ").toLowerCase() + " " + (pipelineTag || "").toLowerCase();
  if (lower.match(/code|codex|coder/)) return "coder";
  if (lower.match(/reasoning|think/)) return "reasoning";
  if (lower.match(/embed|embedding/)) return "embedding";
  if (lower.match(/image|vision|multimodal|vl-/)) return "multimodal";
  if (lower.match(/audio|tts|asr|speech|voice/)) return "voice";
  if (lower.match(/text-generation|text2text/)) return "foundation";
  return "foundation";
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
  if (lower.includes("afl")) return "AFL";
  return license;
}

function inferLicenseStatus(license?: string): string {
  if (!license) return "closed";
  const lower = license.toLowerCase();
  if (lower.includes("mit") || lower.includes("apache") || lower.includes("cc-by") || lower.includes("cc0") || lower.includes("bsd"))
    return "open";
  if (lower.includes("llama") || lower.includes("gemma") || lower.includes("nc") || lower.includes("non-commercial"))
    return "open-nc";
  return "closed";
}

function extractParamsFromTags(tags: string[]): string | null {
  for (const tag of tags) {
    const match = tag.match(/^(\d+\.?\d*[bmk])$/i);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

function slugifyHF(modelId: string): string {
  // e.g. "pfnet/plamo-2.0" -> "plamo-2-0"
  return modelId
    .replace(/^[^/]+\//, "") // remove org prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main Crawl Function ──

export interface HFCrawlResult {
  orgsProcessed: number;
  modelsFetched: number;
  modelsStored: number;
  errors: string[];
}

export async function crawlHuggingFace(
  mode: "full" | "incremental"
): Promise<HFCrawlResult> {
  migrate();
  const db = getDb();
  const sourceId = getSourceId("huggingface");

  const result: HFCrawlResult = {
    orgsProcessed: 0,
    modelsFetched: 0,
    modelsStored: 0,
    errors: [],
  };

  console.log("\n[HuggingFace] Crawling Japanese model organizations...");

  const existingIds = getExistingExternalIds(sourceId);

  for (const [org, info] of Object.entries(JAPANESE_ORGS)) {
    console.log(`  Fetching ${org} (${info.name})...`);
    result.orgsProcessed++;

    const url = `${HF_API_BASE}/models?author=${org}&sort=downloads&direction=-1&limit=100`;

    const logId = startCrawlLog(sourceId, url, mode);

    try {
      const response = await fetchJson<HFModelListResponse>(url, {
        headers: { Accept: "application/json" },
      });

      const models = response.items || [];
      console.log(`    Found ${models.length} models`);

      for (const model of models) {
        // Skip private, gated, or non-language models
        if (model.private || model.gated) continue;

        const pipelineTags = [
          "text-generation",
          "text2text-generation",
          "fill-mask",
          "conversational",
          "feature-extraction",
        ];
        if (model.pipeline_tag && !pipelineTags.includes(model.pipeline_tag)) continue;

        result.modelsFetched++;

        // In incremental mode, skip models we already have (unless forced)
        if (mode === "incremental" && existingIds.has(model.id)) {
          // Update last_seen_at only
          db.prepare(
            "UPDATE raw_models SET last_seen_at = datetime('now') WHERE source_id = ? AND external_id = ?"
          ).run(sourceId, model.id);
          continue;
        }

        const { changed } = upsertRawModel({
          sourceId,
          externalId: model.id,
          sourceUrl: `https://huggingface.co/${model.id}`,
          rawData: {
            id: model.id,
            modelId: model.modelId,
            author: model.author,
            tags: model.tags,
            pipeline_tag: model.pipeline_tag,
            downloads: model.downloads,
            likes: model.likes,
            lastModified: model.lastModified,
            createdAt: model.createdAt,
            license: model.card_data?.license,
            language: model.card_data?.language,
            library_name: model.library_name,
            org_name: info.name,
            org_name_ja: info.nameJa,
            org_url: info.url,
          } as unknown as Record<string, unknown>,
        });

        if (changed) result.modelsStored++;
      }

      endCrawlLog(logId, 200, contentHash(JSON.stringify(models.slice(0, 5))), null);
    } catch (err) {
      const errMsg = String(err);
      endCrawlLog(logId, 0, null, errMsg);
      result.errors.push(`${org}: ${errMsg}`);
      console.warn(`    Failed: ${errMsg}`);
    }
  }

  console.log(
    `  Done: ${result.modelsFetched} models fetched, ${result.modelsStored} new/changed stored`
  );

  return result;
}