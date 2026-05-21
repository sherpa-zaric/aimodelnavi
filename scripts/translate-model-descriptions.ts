#!/usr/bin/env tsx
/**
 * Batch translate model descriptions from Japanese to English/Chinese/Korean.
 * Populates model_translations table.
 * Usage: npx tsx scripts/translate-model-descriptions.ts [en|zh|ko] [batchSize]
 */
import Database from "better-sqlite3";
import { callLLM } from "./lib/anthropic";

const LANG = process.argv[2] || "en";
const BATCH_SIZE = parseInt(process.argv[3] || "20");
const LANG_NAMES: Record<string, string> = { en: "English", zh: "Chinese", ko: "Korean" };

async function main() {
  const db = new Database("data/crawler.db");
  const langName = LANG_NAMES[LANG] || "English";

  // Get Japanese descriptions that don't have target language translation yet
  const rows = db.prepare(`
    SELECT mt.id, mt.model_id, mt.translated_text
    FROM model_translations mt
    WHERE mt.language = 'ja' AND mt.field_name = 'description'
    AND NOT EXISTS (
      SELECT 1 FROM model_translations mt2
      WHERE mt2.model_id = mt.model_id AND mt2.language = ? AND mt2.field_name = 'description'
    )
    LIMIT 50
  `).all(LANG) as { id: number; model_id: number; translated_text: string }[];

  if (rows.length === 0) {
    console.log(`All models already have ${langName} translations.`);
    db.close();
    return;
  }

  console.log(`Translating ${rows.length} models to ${langName}...`);

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const inputText = batch
      .map((r, idx) => `[ID:${r.id}:${r.model_id}] ${r.translated_text.slice(0, 300)}`)
      .join("\n---\n");

    const system = `You are a translator. Translate each Japanese AI model description to ${langName}.
Preserve the [ID:...] marker exactly. Output one translation per line in format:
[ID:123:456] translated text here
Keep technical terms accurate. Do not add any extra text.`;

    try {
      const result = await callLLM(system, inputText, 8192, 120000);
      const lines = result.split("\n").filter((l) => /^\[ID:\d+:\d+\]/.test(l.trim()));

      const insert = db.prepare(
        "INSERT OR REPLACE INTO model_translations (model_id, language, field_name, translated_text, is_ai_generated) VALUES (?, ?, 'description', ?, 1)"
      );
      const tx = db.transaction(() => {
        for (const line of lines) {
          const match = line.match(/\[ID:(\d+):(\d+)\]\s*(.+)/);
          if (match) {
            const modelId = parseInt(match[2]);
            const text = match[3].trim();
            if (text.length > 20) insert.run(modelId, LANG, text);
          }
        }
      });
      tx();
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}: ${lines.length} translated`);
    } catch (err) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err);
    }
  }

  console.log(`Done. Translated ${rows.length} models to ${langName}.`);
  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
