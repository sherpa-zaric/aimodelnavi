/**
 * Translate stage: placeholder for multi-language support.
 * Japanese content is generated directly in the process stage.
 * This module handles future language translations.
 */

import { getDb, migrate } from "../lib/db";
import { translateToJapanese } from "../lib/anthropic";

const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";

export interface TranslateResult {
  translated: number;
  errors: number;
}

export async function translateModels(language: string = "ja"): Promise<TranslateResult> {
  migrate();
  const db = getDb();

  console.log(`\n═══ Stage 3: Translate (${language}) ═══`);

  if (!LLM_API_KEY) {
    console.log("  No LLM_API_KEY, skipping translation stage");
    return { translated: 0, errors: 0 };
  }

  // Find models that need translation
  const models = db.prepare(
    `SELECT id, name, description_ja FROM models
     WHERE description_ja IS NOT NULL
     AND id NOT IN (SELECT model_id FROM model_translations WHERE language = ? AND field_name = 'description')
     ORDER BY id`
  ).all(language) as { id: number; name: string; description_ja: string }[];

  if (models.length === 0) {
    console.log("  All models already translated");
    return { translated: 0, errors: 0 };
  }

  console.log(`  ${models.length} models need ${language} translation`);

  const result: TranslateResult = { translated: 0, errors: 0 };

  for (let i = 0; i < models.length; i += 15) {
    const batch = models.slice(i, i + 15);
    console.log(`  Batch ${Math.floor(i / 15) + 1}/${Math.ceil(models.length / 15)}...`);

    try {
      const texts = batch
        .map((m) => `## ${m.name}\n${m.description_ja || ""}`)
        .join("\n\n");

      // For future languages, translate from Japanese to target language
      if (language !== "ja") {
        const translated = await translateToJapanese(
          texts,
          `Translate to ${language}. Preserve model names in English.`
        );

        const sections = translated.split(/^## /m).filter(Boolean);
        for (let j = 0; j < batch.length; j++) {
          const section = sections[j] || "";
          const desc = section.split("\n").slice(1).join(" ").trim();

          db.prepare(
            `INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, updated_at)
             VALUES (?, ?, 'description', ?, datetime('now'))`
          ).run(batch[j].id, language, desc || batch[j].description_ja || "");
        }
      } else {
        // For Japanese, just mark existing descriptions as translated
        for (const m of batch) {
          db.prepare(
            `INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, is_ai_generated, updated_at)
             VALUES (?, ?, 'description', ?, 1, datetime('now'))`
          ).run(m.id, language, m.description_ja || "");
        }
      }

      result.translated += batch.length;
    } catch (err) {
      console.warn(`  Translation batch failed: ${err}`);
      result.errors += batch.length;
    }

    if (i + 15 < models.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`  Done: ${result.translated} translated, ${result.errors} errors`);
  return result;
}