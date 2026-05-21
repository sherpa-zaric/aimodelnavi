#!/usr/bin/env tsx
/**
 * Translate blog manifest titles and excerpts to English.
 * Generates blog-manifest-en.json for English blog listing.
 */
import { callLLM } from "./lib/anthropic";
import fs from "fs";
import path from "path";

async function main() {
  const manifestPath = path.join(process.cwd(), "src/data/blog-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  console.log(`Translating ${manifest.length} blog titles and excerpts to English...`);

  // Process in batches of 15
  const BATCH_SIZE = 15;
  const translated: { slug: string; title: string; title_en: string; excerpt: string; excerpt_en: string; tag: string; date: string }[] = [];

  for (let i = 0; i < manifest.length; i += BATCH_SIZE) {
    const batch = manifest.slice(i, i + BATCH_SIZE);
    const input = batch
      .map((p: any, idx: number) => `[${idx}] title: ${p.title}\nexcerpt: ${p.excerpt || ""}`)
      .join("\n---\n");

    const system = `Translate these Japanese blog titles and excerpts to English. Output one translation per line in this exact format:
[0] Title: English title
[0] Excerpt: English excerpt (2-3 sentences)
Keep AI/ML technical terms accurate. Preserve numbers.`;

    try {
      const result = await callLLM(system, input, 8192, 120000);
      const lines = result.split("\n");

      for (let j = 0; j < batch.length; j++) {
        const titleLine = lines.find((l) => l.startsWith(`[${j}] Title:`));
        const excerptLine = lines.find((l) => l.startsWith(`[${j}] Excerpt:`));
        translated.push({
          ...batch[j],
          title_en: titleLine ? titleLine.replace(/^\[\d+\] Title:\s*/, "") : batch[j].title,
          excerpt_en: excerptLine ? excerptLine.replace(/^\[\d+\] Excerpt:\s*/, "") : batch[j].excerpt || "",
        });
      }
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(manifest.length / BATCH_SIZE)} done`);
    } catch (err) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err);
      // Add untranslated items
      for (const p of batch) {
        translated.push({ ...p, title_en: p.title, excerpt_en: p.excerpt || "" });
      }
    }
  }

  // Write English manifest
  const outPath = path.join(process.cwd(), "src/data/blog-manifest-en.json");
  fs.writeFileSync(outPath, JSON.stringify(translated, null, 2));
  console.log(`Done. Saved ${translated.length} translations to blog-manifest-en.json`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
