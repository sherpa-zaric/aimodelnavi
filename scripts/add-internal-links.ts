#!/usr/bin/env tsx

/**
 * add-internal-links.ts — Auto-add internal links (関連記事) to blog posts
 *
 * Uses a blog manifest + LLM to find related articles for each post.
 * New posts (without 関連記事) get automatic links added.
 * Existing posts are left unchanged.
 *
 * Usage:
 *   npx tsx scripts/add-internal-links.ts              # dry run
 *   npx tsx scripts/add-internal-links.ts --apply       # write changes
 *   npx tsx scripts/add-internal-links.ts --force        # re-link all posts
 *   npx tsx scripts/add-internal-links.ts --slug xxx     # re-link specific post
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { findRelatedArticles } from "./lib/anthropic";
import type { ManifestEntry } from "./blog-manifest";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const MANIFEST_PATH = path.join(process.cwd(), "src/data/blog-manifest.json");

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const SLUG_IDX = process.argv.indexOf("--slug");
const TARGET_SLUG = SLUG_IDX !== -1 ? process.argv[SLUG_IDX + 1] : null;

// ── Load manifest ──

function loadManifest(): ManifestEntry[] {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`  Manifest not found: ${MANIFEST_PATH}`);
    console.error("  Run `npx tsx scripts/blog-manifest.ts` first.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

// ── Check if post already has 関連記事 ──

function hasRelatedSection(content: string): boolean {
  return content.includes("## 関連記事");
}

// ── Remove existing 関連記事 section ──

function removeRelatedSection(content: string): string {
  // Remove from "## 関連記事" to end, including the "---" separator before it
  return content.replace(/\n+---\n+## 関連記事[\s\S]*$/, "").trimEnd();
}

// ── Main ──

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  内鏈自動追加 (関連記事)");
  console.log("═══════════════════════════════════════\n");

  const manifest = loadManifest();
  console.log(`  Manifest: ${manifest.length} posts loaded\n`);

  // Determine which posts to process
  let postsToProcess: ManifestEntry[];

  if (TARGET_SLUG) {
    // Single post mode
    const target = manifest.find((p) => p.slug === TARGET_SLUG);
    if (!target) {
      console.error(`  Post not found: ${TARGET_SLUG}`);
      process.exit(1);
    }
    postsToProcess = [target];
  } else if (FORCE) {
    // Re-link all posts
    postsToProcess = manifest;
  } else {
    // Only process posts without 関連記事
    postsToProcess = manifest.filter((post) => {
      const filePath = path.join(BLOG_DIR, `${post.slug}.md`);
      if (!fs.existsSync(filePath)) return false;
      const raw = fs.readFileSync(filePath, "utf-8");
      return !hasRelatedSection(raw);
    });
  }

  if (postsToProcess.length === 0) {
    console.log("  All posts already have internal links.");
    console.log("  Use --force to re-link all, or --slug <slug> to re-link one.");
    return;
  }

  console.log(`  Processing ${postsToProcess.length} posts...\n`);

  let updated = 0;
  let errors = 0;

  for (const post of postsToProcess) {
    const filePath = path.join(BLOG_DIR, `${post.slug}.md`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ✗ File not found: ${post.slug}`);
      errors++;
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    // Find related articles via LLM
    console.log(`  [${post.slug}]`);
    console.log(`    Title: ${post.title}`);
    console.log(`    Topics: ${post.topics.join(", ")}`);

    const related = await findRelatedArticles(
      {
        slug: post.slug,
        title: post.title,
        tag: post.tag,
        excerpt: post.excerpt,
        topics: post.topics,
      },
      manifest,
      3
    );

    if (related.length === 0) {
      console.log(`    → No related articles found\n`);
      continue;
    }

    // Build the 関連記事 section
    const links = related
      .map((r) => {
        const target = manifest.find((m) => m.slug === r.slug);
        if (!target) return null;
        return `- [${target.title}](/blog/${r.slug})`;
      })
      .filter(Boolean);

    const relatedSection = `\n\n---\n\n## 関連記事\n\n${links.join("\n")}\n`;

    // Show preview
    for (const r of related) {
      const target = manifest.find((m) => m.slug === r.slug);
      console.log(`    → ${target?.title || r.slug}`);
      console.log(`      理由: ${r.reason}`);
    }

    if (APPLY) {
      // Remove existing section if force mode
      let newContent = FORCE ? removeRelatedSection(content) : content.trimEnd();
      newContent = newContent + relatedSection;

      const newFile = matter.stringify(newContent, data);
      fs.writeFileSync(filePath, newFile, "utf-8");
      console.log(`    ✓ Written\n`);
    } else {
      console.log(`    [dry-run]\n`);
    }

    updated++;
  }

  console.log(`  ${APPLY ? "Updated" : "Would update"}: ${updated}, Errors: ${errors}`);

  if (!APPLY) {
    console.log("\n  Run with --apply to write changes.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
