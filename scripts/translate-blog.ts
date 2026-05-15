#!/usr/bin/env tsx

/**
 * translate-blog.ts — Chinese → Japanese blog translation and publishing
 *
 * Translates a Chinese Markdown blog post into Japanese and saves it
 * to src/content/blog/ for the AI Models Navi website.
 *
 * Two usage modes:
 *
 *   Mode A — From file (local debugging):
 *     npx tsx scripts/translate-blog.ts _drafts/my-article.md
 *
 *   Mode B — From arguments (GitHub Actions):
 *     echo "$CONTENT" | npx tsx scripts/translate-blog.ts \
 *       --title "中文标题" --tag "Anthropic" --excerpt "摘要" --stdin
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { translateBlogMarkdown } from "./lib/anthropic";
import { saveBlogPost } from "./lib/storage";

// ── CLI argument parsing ──

interface InputParams {
  title: string;
  tag: string;
  excerpt: string;
  body: string;
}

function parseArgs(): InputParams | null {
  const args = process.argv.slice(2);

  // Mode B: --stdin with --title flag
  const stdinFlag = args.includes("--stdin");
  const titleIdx = args.indexOf("--title");
  const tagIdx = args.indexOf("--tag");
  const excerptIdx = args.indexOf("--excerpt");

  if (stdinFlag || titleIdx !== -1) {
    const title = titleIdx !== -1 ? args[titleIdx + 1] : "";
    const tag = tagIdx !== -1 ? args[tagIdx + 1] : "解説";
    const excerpt = excerptIdx !== -1 ? args[excerptIdx + 1] : "";

    if (!title) {
      console.error("Error: --title is required");
      process.exit(1);
    }

    // Read body from stdin
    const body = fs.readFileSync(0, "utf-8").trim();
    if (!body) {
      console.error("Error: empty stdin (no article content)");
      process.exit(1);
    }

    return { title, tag, excerpt, body };
  }

  // Mode A: file path argument
  const filePath = args.find((a) => !a.startsWith("--"));
  if (!filePath) {
    console.error("Usage:");
    console.error("  npx tsx scripts/translate-blog.ts <file.md>");
    console.error("  echo content | npx tsx scripts/translate-blog.ts --title '标题' --tag 'Tag' --stdin");
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: file not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const { data, content } = matter(raw);

  return {
    title: data.title || path.basename(filePath, ".md"),
    tag: data.tag || "解説",
    excerpt: data.excerpt || "",
    body: content.trim(),
  };
}

// ── Slug generation ──

function generateSlug(titleJa: string): string {
  // Try to extract English/ASCII words from the Japanese title for a clean slug
  const asciiWords = titleJa.match(/[a-zA-Z0-9][a-zA-Z0-9._-]*/g);

  if (asciiWords && asciiWords.length >= 2) {
    // Use English words from the title (e.g., "Claude Opus 4.7" → "claude-opus-4-7")
    const slug = asciiWords
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .slice(0, 80);

    if (slug.length >= 10) return slug;
  }

  // Fallback: date-based slug with short hash
  const date = new Date().toISOString().split("T")[0];
  const hash = Math.random().toString(36).slice(2, 8);
  return `blog-${date}-${hash}`;
}

// ── Image URL validation ──

async function cleanImageUrls(content: string): Promise<string> {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let cleaned = content;
  const removals: string[] = [];

  // Collect all image references
  const images: { full: string; alt: string; url: string }[] = [];
  while ((match = imgRegex.exec(content)) !== null) {
    images.push({ full: match[0], alt: match[1], url: match[2] });
  }

  if (images.length === 0) return content;

  console.log(`\n  Validating ${images.length} image URL(s)...`);

  for (const img of images) {
    // Check if URL is a known image file extension or image host
    const isImageFile = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(img.url) ||
      /images\.unsplash\.com|pbs\.twimg\.com|imgur\.com|cloudinary\.com|cdn\.openai\.com|storage\.googleapis\.com/i.test(img.url);

    if (isImageFile) {
      // Verify the URL is actually accessible
      try {
        const res = await fetch(img.url, {
          method: "HEAD",
          headers: { "User-Agent": "AIModelsNavi/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (ct.startsWith("image/")) {
            console.log(`  ✓ ${img.url.slice(0, 80)}`);
            continue; // Valid image
          }
        }
        console.log(`  ✗ Not an image (${res.status}): ${img.url.slice(0, 60)}`);
        removals.push(img.full);
      } catch {
        console.log(`  ✗ Unreachable: ${img.url.slice(0, 60)}`);
        removals.push(img.full);
      }
    } else {
      // URL is a web page, not an image file — try to extract og:image
      console.log(`  ✗ Web page (not image): ${img.url.slice(0, 60)}`);
      removals.push(img.full);
    }
  }

  // Remove broken image references
  for (const ref of removals) {
    cleaned = cleaned.replace(ref, "");
  }

  // Clean up extra blank lines left by removal
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  if (removals.length > 0) {
    console.log(`  Removed ${removals.length} broken image reference(s)`);
  }

  return cleaned;
}

// ── Main ──

async function main() {
  const input = parseArgs();
  if (!input) return;

  console.log("═══════════════════════════════════════");
  console.log("  ブログ翻訳・公開 (CN → JP)");
  console.log("═══════════════════════════════════════\n");
  console.log(`  Title: ${input.title}`);
  console.log(`  Tag: ${input.tag}`);
  console.log(`  Body: ${input.body.length} chars`);

  // Step 1: Translate
  console.log("\n  Translating to Japanese...");
  const translated = await translateBlogMarkdown(
    input.title,
    input.body,
    input.excerpt || undefined
  );

  // Validate translation actually happened
  const hasJapanese = /[　-鿿豈-﫿]/.test(translated.content);
  if (!hasJapanese) {
    console.error("  ✗ Translation failed: content contains no Japanese characters");
    console.error("  The LLM may have returned the original Chinese or JSON as text.");
    process.exit(1);
  }

  console.log(`  ✓ Title: ${translated.title}`);
  console.log(`  ✓ Tag: ${translated.tag}`);
  console.log(`  ✓ Excerpt: ${translated.excerpt.slice(0, 80)}...`);
  console.log(`  ✓ Content: ${translated.content.length} chars`);

  // Step 1.5: Validate and clean image URLs
  translated.content = await cleanImageUrls(translated.content);

  // Step 2: Generate slug and save
  const slug = generateSlug(translated.title);
  const today = new Date().toISOString().split("T")[0];

  saveBlogPost(slug, {
    title: translated.title,
    date: today,
    tag: translated.tag,
    excerpt: translated.excerpt,
  }, translated.content);

  console.log(`\n  ✓ Published: src/content/blog/${slug}.md`);
  console.log(`  ✓ URL: /blog/${slug}`);
  console.log(`\n  Done!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
