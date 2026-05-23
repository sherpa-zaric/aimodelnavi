#!/usr/bin/env tsx

/**
 * backfill-en-blog.ts — Generate missing English translations for existing blog posts
 *
 * Iterates over all Japanese blog posts and generates English versions
 * for any that are missing from blog-en/.
 *
 * Usage:
 *   npx tsx scripts/backfill-en-blog.ts
 *   npx tsx scripts/backfill-en-blog.ts --dry-run  # preview without generating
 *   npx tsx scripts/backfill-en-blog.ts --limit 5  # process only 5 posts
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { processBlogArticleEn } from "./lib/anthropic";
import { saveBlogPostEn } from "./lib/storage";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const BLOG_EN_DIR = path.join(process.cwd(), "src/content/blog-en");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || Infinity : Infinity;

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  tag: string;
  images: { alt: string; localPath: string }[];
}

function extractImages(content: string, slug: string): { alt: string; localPath: string }[] {
  const imageRegex = /!\[([^\]]*)\]\((\/images\/blog\/[^)]+)\)/g;
  const images: { alt: string; localPath: string }[] = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({ alt: match[1] || "Blog image", localPath: match[2] });
  }
  return images;
}

async function translatePost(post: BlogPost): Promise<void> {
  console.log(`\n  [${post.slug}] Translating...`);
  console.log(`    Title: ${post.title.slice(0, 60)}...`);

  const enResult = await processBlogArticleEn(
    post.title,
    post.content,
    "",
    post.images.length > 0 ? post.images : undefined
  );

  saveBlogPostEn(post.slug, {
    title: enResult.title,
    date: post.date,
    tag: enResult.tag || post.tag || "AI",
    excerpt: enResult.excerpt || "",
  }, enResult.content);

  console.log(`    ✓ EN title: ${enResult.title.slice(0, 60)}...`);
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Backfill English Blog Translations");
  console.log("═══════════════════════════════════════\n");

  // Get all Japanese posts
  const jaFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".md"));
  console.log(`  Found ${jaFiles.length} Japanese posts`);

  // Get existing English posts
  const enFiles = new Set(
    fs.existsSync(BLOG_EN_DIR)
      ? fs.readdirSync(BLOG_EN_DIR).filter(f => f.endsWith(".md")).map(f => f.replace(/\.md$/, ""))
      : []
  );
  console.log(`  Found ${enFiles.size} English posts`);

  // Find missing posts
  const missingPosts: BlogPost[] = [];
  for (const file of jaFiles) {
    const slug = file.replace(".md", "");
    if (enFiles.has(slug)) continue;

    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    missingPosts.push({
      slug,
      title: data.title || slug,
      content: content.trim(),
      excerpt: data.excerpt || "",
      date: data.date || "",
      tag: data.tag || "",
      images: extractImages(content, slug),
    });
  }

  console.log(`  Missing: ${missingPosts.length} posts need English translation\n`);

  if (missingPosts.length === 0) {
    console.log("  All posts already have English versions!");
    return;
  }

  if (DRY_RUN) {
    console.log("  Dry run — would translate:");
    for (const post of missingPosts.slice(0, 20)) {
      console.log(`    - ${post.slug}: ${post.title.slice(0, 50)}...`);
    }
    if (missingPosts.length > 20) {
      console.log(`    ... and ${missingPosts.length - 20} more`);
    }
    return;
  }

  // Process posts
  const toProcess = missingPosts.slice(0, LIMIT);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const post = toProcess[i];
    console.log(`\n  [${i + 1}/${toProcess.length}] ${post.slug}`);

    try {
      await translatePost(post);
      success++;
    } catch (err) {
      console.error(`    ✗ Failed: ${err}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Complete: ${success} success, ${failed} failed`);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
