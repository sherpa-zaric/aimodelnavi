/**
 * Translate stage: generates English translations for model fields.
 * Translates: description, strengths, weaknesses, useCases from JA to EN.
 */

import { getDb, migrate } from "../lib/db";
import { callLLM } from "../lib/anthropic";

const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";

export interface TranslateResult {
  translated: number;
  errors: number;
}

// Translate developer names to English
const developerEnMap: Record<string, string> = {
  "アリババ": "Alibaba",
  "Zhipu AI": "Zhipu AI",
  "バイドゥ": "Baidu",
  "テンセントAI研究所": "Tencent AI Lab",
  "ファーウェイ": "Huawei",
  "アマゾン": "Amazon",
  "上海人工知能研究所": "Shanghai AI Lab",
  "プリンストン大学": "Princeton University",
  "Meta AI": "Meta AI",
  "DeepSeek": "DeepSeek",
  "Xiaomi": "Xiaomi",
  "ByteDance": "ByteDance",
  "ByteDance Seed": "ByteDance Seed",
  "NetEase": "NetEase",
  "iFlytek": "iFlytek",
  "SenseTime": "SenseTime",
  "Megvii": "Megvii",
  "Baichuan AI": "Baichuan AI",
  "XVERSE": "XVERSE",
  "Kunlun Tech": "Kunlun Tech",
  "富士通": "Fujitsu",
  "個人": "Individual",
  "Google": "Google",
  "OpenAI": "OpenAI",
  "Anthropic": "Anthropic",
  "Meta": "Meta",
  "Microsoft": "Microsoft",
  "xAI": "xAI",
  "Moonshot AI": "Moonshot AI",
  "01.AI": "01.AI",
};

function translateDeveloperEn(dev: string): string {
  return developerEnMap[dev] || dev;
}

export async function translateModels(language: string = "en"): Promise<TranslateResult> {
  migrate();
  const db = getDb();

  console.log(`\n═══ Stage 3: Translate (${language}) ═══`);

  if (!LLM_API_KEY) {
    console.log("  No LLM_API_KEY, skipping translation stage");
    return { translated: 0, errors: 0 };
  }

  // Ensure model_translations table exists with the right schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS model_translations (
      model_id INTEGER,
      language TEXT,
      field_name TEXT,
      translated_text TEXT,
      is_ai_generated INTEGER DEFAULT 1,
      updated_at TEXT,
      PRIMARY KEY (model_id, language, field_name)
    )
  `);

  // Find models that need English array translations
  const models = db.prepare(
    `SELECT id, name, strengths, weaknesses, use_cases
     FROM models
     WHERE strengths IS NOT NULL OR weaknesses IS NOT NULL OR use_cases IS NOT NULL
     ORDER BY id`
  ).all() as { id: number; name: string; strengths: string | null; weaknesses: string | null; use_cases: string | null }[];

  // Filter to models missing EN translations for array fields
  const existingEn = new Map<number, Set<string>>();
  const rows = db.prepare(
    `SELECT model_id, field_name FROM model_translations WHERE language = 'en'`
  ).all() as { model_id: number; field_name: string }[];
  for (const r of rows) {
    if (!existingEn.has(r.model_id)) existingEn.set(r.model_id, new Set());
    existingEn.get(r.model_id)!.add(r.field_name);
  }

  const needsTranslation = models.filter(m => {
    const existing = existingEn.get(m.id);
    return !existing || !existing.has('strengths') || !existing.has('weaknesses') || !existing.has('use_cases');
  });

  if (needsTranslation.length === 0) {
    console.log("  All model array fields already translated to EN");
    return { translated: 0, errors: 0 };
  }

  console.log(`  ${needsTranslation.length} models need EN array translations`);
  const result: TranslateResult = { translated: 0, errors: 0 };

  for (let i = 0; i < needsTranslation.length; i += 10) {
    const batch = needsTranslation.slice(i, i + 10);
    console.log(`  Batch ${Math.floor(i / 10) + 1}/${Math.ceil(needsTranslation.length / 10)}...`);

    try {
      const input = batch.map(m => {
        const s = m.strengths ? JSON.parse(m.strengths) : [];
        const w = m.weaknesses ? JSON.parse(m.weaknesses) : [];
        const u = m.use_cases ? JSON.parse(m.use_cases) : [];
        return `## ${m.name}
strengths: ${JSON.stringify(s)}
weaknesses: ${JSON.stringify(w)}
useCases: ${JSON.stringify(u)}`;
      }).join("\n\n");

      const system = `Translate these Japanese model attribute arrays to English. Keep model names in English.
Output each section as:
## Model Name
strengths_en: ["translated1", "translated2", "translated3"]
weaknesses_en: ["translated1", "translated2", "translated3"]
useCases_en: ["translated1", "translated2", "translated3"]

Keep translations concise (10-20 words each). Preserve technical accuracy.`;

      const result_text = await callLLM(system, input, 4096, 60000);
      const sections = result_text.split(/^## /m).filter(Boolean);

      for (let j = 0; j < batch.length; j++) {
        const section = sections[j] || "";
        const m = batch[j];

        const parseArray = (field: string): string[] => {
          const match = section.match(new RegExp(`${field}:\\s*(\\[.*?\\])`, "s"));
          if (match) {
            try { return JSON.parse(match[1]); } catch {}
          }
          return [];
        };

        const strengthsEn = parseArray("strengths_en");
        const weaknessesEn = parseArray("weaknesses_en");
        const useCasesEn = parseArray("useCases_en");

        if (strengthsEn.length > 0) {
          db.prepare(
            `INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, is_ai_generated, updated_at)
             VALUES (?, 'en', 'strengths', ?, 1, datetime('now'))`
          ).run(m.id, JSON.stringify(strengthsEn));
        }
        if (weaknessesEn.length > 0) {
          db.prepare(
            `INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, is_ai_generated, updated_at)
             VALUES (?, 'en', 'weaknesses', ?, 1, datetime('now'))`
          ).run(m.id, JSON.stringify(weaknessesEn));
        }
        if (useCasesEn.length > 0) {
          db.prepare(
            `INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, is_ai_generated, updated_at)
             VALUES (?, 'en', 'use_cases', ?, 1, datetime('now'))`
          ).run(m.id, JSON.stringify(useCasesEn));
        }

        result.translated++;
      }

      console.log(`    Batch done`);
    } catch (err) {
      console.warn(`    Batch failed: ${err}`);
      result.errors += batch.length;
    }

    if (i + 10 < needsTranslation.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`  Done: ${result.translated} translated, ${result.errors} errors`);
  return result;
}
