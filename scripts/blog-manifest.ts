#!/usr/bin/env tsx

/**
 * blog-manifest.ts — Blog post manifest generator
 *
 * Scans all blog posts and generates a manifest JSON file with metadata
 * (title, tag, excerpt, topics) for each post. Used by the internal
 * linking system to find related articles via LLM.
 *
 * Usage:
 *   npx tsx scripts/blog-manifest.ts              # generate manifest
 *   npx tsx scripts/blog-manifest.ts --check      # check for new/missing posts
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const MANIFEST_PATH = path.join(process.cwd(), "src/data/blog-manifest.json");

export interface ManifestEntry {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  topics: string[]; // key topics extracted from content
  date: string;
}

// ── Topic extraction (simple keyword-based) ──

const TOPIC_KEYWORDS: Record<string, RegExp> = {
  "Anthropic": /anthropic|claude|mythos|opus/i,
  "OpenAI": /openai|gpt-5|chatgpt|codex/i,
  "Google": /google|gemini|gemma|android/i,
  "DeepSeek": /deepseek/i,
  "Qwen/Alibaba": /qwen|alibaba|アリババ/i,
  "xAI/Grok": /xai|grok/i,
  "ベンチマーク": /ベンチマーク|benchmark|swe-bench|arc-agi|clawbench|osworld/i,
  "AIエージェント": /エージェント|agent|frontier|codex/i,
  "オープンソース": /オープンソース|open.?source/i,
  "料金比較": /料金|pricing|api.*cost/i,
  "セキュリティ": /セキュリティ|security|daybreak|mythos.*glasswing/i,
  "推論": /推論|reasoning|chain.?of.?thought/i,
  "マルチモーダル": /マルチモーダル|multimodal|vision|画像/i,
  "音声": /音声|speech|tts|voice/i,
  "コーディング": /コーディング|coding|code.?generation|swe/i,
  "MoE": /moe|mixture.?of.?experts|スパース/i,
  "RLHF": /rlhf|reward.?model|報酬/i,
  "LLM": /llm|large.?language.?model|大規模言語/i,
};

function extractTopics(content: string, tag: string): string[] {
  const topics: string[] = [];

  // Always include the tag
  if (tag && tag !== "解説" && tag !== "速報") {
    topics.push(tag);
  }

  // Scan for keyword matches
  for (const [topic, regex] of Object.entries(TOPIC_KEYWORDS)) {
    if (regex.test(content) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  // Limit to 5 most relevant
  return topics.slice(0, 5);
}

// ── Load all posts ──

function loadAllPosts(): ManifestEntry[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const entries: ManifestEntry[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    // Skip broken posts (raw JSON in body)
    if (content.trim().startsWith("{") && content.includes('"title"')) {
      console.warn(`  ⚠ Skipping broken post: ${slug}`);
      continue;
    }

    entries.push({
      slug,
      title: data.title || slug,
      tag: data.tag || "解説",
      excerpt: data.excerpt || "",
      topics: extractTopics(content, data.tag || ""),
      date: data.date || "",
    });
  }

  return entries.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// ── Main ──

function main() {
  const checkMode = process.argv.includes("--check");

  console.log("═══════════════════════════════════════");
  console.log("  ブログマニフェスト");
  console.log("═══════════════════════════════════════\n");

  const posts = loadAllPosts();
  console.log(`  Found ${posts.length} blog posts\n`);

  // Check mode: compare with existing manifest
  if (checkMode && fs.existsSync(MANIFEST_PATH)) {
    const existing: ManifestEntry[] = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf-8")
    );
    const existingSlugs = new Set(existing.map((e) => e.slug));
    const currentSlugs = new Set(posts.map((p) => p.slug));

    const added = posts.filter((p) => !existingSlugs.has(p.slug));
    const removed = existing.filter((e) => !currentSlugs.has(e.slug));

    if (added.length > 0) {
      console.log(`  New posts (${added.length}):`);
      for (const p of added) console.log(`    + ${p.slug}`);
    }
    if (removed.length > 0) {
      console.log(`  Removed posts (${removed.length}):`);
      for (const p of removed) console.log(`    - ${p.slug}`);
    }
    if (added.length === 0 && removed.length === 0) {
      console.log("  No changes detected.");
    }
  }

  // Write manifest
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(posts, null, 2), "utf-8");

  // Print summary
  const tagCounts: Record<string, number> = {};
  for (const p of posts) {
    tagCounts[p.tag] = (tagCounts[p.tag] || 0) + 1;
  }

  console.log("  Tags:");
  for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${tag}: ${count}`);
  }

  console.log(`\n  ✓ Manifest saved to ${MANIFEST_PATH}`);
}

main();
