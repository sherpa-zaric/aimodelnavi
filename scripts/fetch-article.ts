#!/usr/bin/env tsx

/**
 * fetch-article.ts — Fetch article from URL and generate Chinese Markdown
 *
 * Supports: WeChat (微信公众号), Zhihu, CSDN, Juejin, sspai, and general web pages.
 * Uses Playwright for rendering and DOM extraction. LLM optional for cleanup.
 *
 * Usage:
 *   npx tsx scripts/fetch-article.ts <URL>
 *   npx tsx scripts/fetch-article.ts <URL> --no-images
 *   npx tsx scripts/fetch-article.ts <URL> --tag "Anthropic"
 *   npx tsx scripts/fetch-article.ts <URL> --slug "step-37-flash-agent"  # custom slug
 *   npx tsx scripts/fetch-article.ts <URL> --llm          # force LLM cleanup
 *
 * Output: _drafts/<slug>.md (Chinese Markdown with frontmatter)
 *   → ready for: ./scripts/publish-blog.sh _drafts/<slug>.md
 */

import fs from "fs";
import path from "path";
import { chromium, type Browser, type Page } from "playwright";
import { filterImages, type ImageToFilter } from "./lib/image-filter";
import { blurWatermark, isWatermarkedSource } from "./lib/watermark";

// ── CLI args ──

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const NO_IMAGES = args.includes("--no-images");
const USE_LLM = args.includes("--llm");
const NO_FILTER = args.includes("--no-filter-images");
const FILTER_IMAGES = !NO_FILTER; // filter by default
const BLUR_WATERMARK = args.includes("--blur-watermark");
const tagIdx = args.indexOf("--tag");
const TAG = tagIdx !== -1 ? args[tagIdx + 1] : "";
const slugIdx = args.indexOf("--slug");
const CUSTOM_SLUG = slugIdx !== -1 ? args[slugIdx + 1] : "";

if (!url) {
  console.error("Usage: npx tsx scripts/fetch-article.ts <URL> [--no-images] [--tag Tag] [--slug name] [--llm] [--no-filter-images]");
  process.exit(1);
}

// ── Constants ──

const DRAFTS_DIR = path.join(process.cwd(), "_drafts");
const IMG_DIR = path.join(process.cwd(), "public/images/blog");

// ── Helpers ──

function isWeChat(targetUrl: string): boolean {
  return /mp\.weixin\.qq\.com/.test(targetUrl);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateSlug(title: string): string {
  const asciiWords = title.match(/[a-zA-Z0-9][a-zA-Z0-9._-]*/g);
  if (asciiWords && asciiWords.length >= 2) {
    const slug = asciiWords.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 80);
    if (slug.length >= 10) return slug;
  }
  const date = new Date().toISOString().split("T")[0];
  const hash = Math.random().toString(36).slice(2, 8);
  return `article-${date}-${hash}`;
}

// ── Step 1: Fetch page with Playwright ──

async function fetchPage(targetUrl: string): Promise<Page> {
  console.log(`\n  Fetching: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "zh-CN",
  });
  const page = await context.newPage();

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });

  if (isWeChat(targetUrl)) {
    await page.waitForTimeout(3000);
  }

  console.log(`  ✓ Page loaded`);
  return page;
}

// ── Step 2: Extract article via DOM ──

interface ExtractedArticle {
  title: string;
  author: string;
  date: string;
  content: string; // Markdown
  images: string[];
}

async function extractFromDom(page: Page, sourceUrl: string): Promise<ExtractedArticle> {
  console.log("\n  Extracting from DOM...");

  const hostname = new URL(sourceUrl).hostname;

  // Site-specific content selectors
  let contentSel = "article";
  let titleSel = "h1";
  let authorSel = ".author";
  let dateSel = "time";

  if (isWeChat(sourceUrl)) {
    contentSel = "#js_content";
    titleSel = "#activity-name";
    authorSel = "#js_name";
    dateSel = "#publish_time";
  } else if (hostname.includes("zhihu")) {
    contentSel = ".Post-RichText";
    titleSel = ".Post-Title";
    authorSel = ".AuthorInfo-name";
    dateSel = ".ContentItem-time";
  } else if (hostname.includes("csdn")) {
    contentSel = "#article_content";
    titleSel = ".title-article h1";
    authorSel = ".follow-nickName";
    dateSel = ".time";
  } else if (hostname.includes("juejin")) {
    contentSel = ".article-content";
    titleSel = ".article-title h1";
    authorSel = ".author-name";
    dateSel = ".time";
  } else if (hostname.includes("sspai")) {
    contentSel = ".article-body";
    titleSel = "h1";
    authorSel = ".author-name";
    dateSel = ".article-date";
  } else if (hostname.includes("jianshu")) {
    contentSel = ".article";
    titleSel = "h1.title";
    authorSel = ".author-name";
    dateSel = ".publish-time";
  }

  // Extract metadata
  const title = await page.locator(titleSel).first().textContent().catch(() => "") || await page.title();
  const author = await page.locator(authorSel).first().textContent().catch(() => "");
  const dateText = await page.locator(dateSel).first().textContent().catch(() => "");

  // Get content HTML and convert to text with structure
  const contentHtml = await page.locator(contentSel).first().innerHTML().catch(() => "");

  if (!contentHtml || contentHtml.length < 100) {
    throw new Error("Content element not found or too short");
  }

  // Extract images
  const images = await page.locator(contentSel).first().evaluate((el) => {
    const imgs = el.querySelectorAll("img");
    const urls: string[] = [];
    imgs.forEach((img) => {
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (src && src.startsWith("http") && !urls.includes(src)) urls.push(src);
    });
    return urls;
  });

  // Convert HTML to Markdown (server-side, no eval issues)
  const content = htmlToMarkdown(contentHtml);

  const article: ExtractedArticle = {
    title: title.trim(),
    author: author.trim(),
    date: dateText.trim(),
    content: content.replace(/\[([^\]]*)\]\(https:\/\/mp\.weixin\.qq\.com\/[^)]+\)/g, "$1"),
    images,
  };

  console.log(`  ✓ Title: ${article.title}`);
  console.log(`  ✓ Author: ${article.author || "(不明)"}`);
  console.log(`  ✓ Content: ${article.content.length} chars`);
  console.log(`  ✓ Images: ${article.images.length} found`);

  return article;
}

function htmlToMarkdown(html: string): string {
  let text = html;

  // Remove script/style
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Code blocks
  text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return "\n```\n" + decodeEntities(code).trim() + "\n```\n";
  });
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    return "\n```\n" + decodeEntities(code).trim() + "\n```\n";
  });

  // Inline code
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");

  // Images (WeChat uses data-src)
  text = text.replace(/<img[^>]*data-src="(https?:\/\/[^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");
  text = text.replace(/<img[^>]*src="(https?:\/\/[^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");
  text = text.replace(/<img[^>]*data-src="(https?:\/\/[^"]+)"[^>]*>/gi, "![]($1)");
  text = text.replace(/<img[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi, "![]($1)");

  // Links
  text = text.replace(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Bold/italic
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");

  // Blockquote
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    return "\n" + inner.split("\n").map((l: string) => "> " + l).join("\n") + "\n";
  });

  // Paragraphs and breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<div[^>]*>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode entities
  text = decodeEntities(text);

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, "");
}

// ── Step 3: Optional LLM cleanup ──

async function llmCleanup(article: ExtractedArticle): Promise<ExtractedArticle> {
  if (!USE_LLM) return article;

  console.log("\n  LLM cleanup...");
  const { callLLM } = await import("./lib/anthropic");

  const maxInput = 20000;
  const truncated = article.content.length > maxInput
    ? article.content.slice(0, maxInput) + "\n\n[text truncated]"
    : article.content;

  const system = `Clean up this Chinese Markdown article. Fix formatting issues, improve structure, keep all content accurate.
Rules:
- Fix broken Markdown syntax
- Ensure proper heading hierarchy
- Keep all data, numbers, code blocks intact
- Remove noise (ads, navigation remnants)
- Keep all image references as ![alt](url)
- Output clean Markdown only, no JSON wrapper`;

  try {
    const cleaned = await callLLM(system, truncated, 8192, 60000);
    // Check if response is valid (not wrapped in JSON)
    if (cleaned.includes("```") || cleaned.includes("# ")) {
      article.content = cleaned.replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
      console.log(`  ✓ Cleaned: ${article.content.length} chars`);
    }
  } catch (err) {
    console.warn(`  ⚠ LLM cleanup failed: ${err}`);
  }

  return article;
}

// ── Step 4: Download images ──

async function downloadImages(
  images: string[],
  slug: string,
  sourceUrl: string
): Promise<{ localPath: string; originalUrl: string }[]> {
  if (NO_IMAGES || images.length === 0) return [];

  console.log(`\n  Downloading ${images.length} image(s)...`);

  const slugImgDir = path.join(IMG_DIR, slug);
  fs.mkdirSync(slugImgDir, { recursive: true });

  const results: { localPath: string; originalUrl: string }[] = [];
  let index = 1;

  for (const imgUrl of images) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      };
      if (isWeChat(sourceUrl)) {
        headers["Referer"] = "https://mp.weixin.qq.com/";
      }

      const res = await fetch(imgUrl, {
        headers,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.log(`  ✗ HTTP ${res.status}: ${imgUrl.slice(0, 60)}`);
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        console.log(`  ✗ Not image: ${imgUrl.slice(0, 60)}`);
        continue;
      }

      let ext = "webp";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("gif")) ext = "gif";

      const filename = `img-${index}.${ext}`;
      const filePath = path.join(slugImgDir, filename);
      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.length < 1024) {
        console.log(`  ✗ Too small: ${imgUrl.slice(0, 60)}`);
        continue;
      }

      // Blur watermark if enabled and source is WeChat
      let finalBuffer = buffer;
      if (BLUR_WATERMARK && isWatermarkedSource(imgUrl)) {
        try {
          finalBuffer = await blurWatermark(buffer);
          console.log(`    ✓ Watermark blurred`);
        } catch {
          console.log(`    ⚠ Blur failed, using original`);
        }
      }

      fs.writeFileSync(filePath, finalBuffer);
      const localPath = `/images/blog/${slug}/${filename}`;
      results.push({ localPath, originalUrl: imgUrl });
      console.log(`  ✓ ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
      index++;
    } catch {
      console.log(`  ✗ Failed: ${imgUrl.slice(0, 60)}`);
    }
  }

  return results;
}

// ── Step 5: Save as Markdown ──

function saveDraft(
  article: ExtractedArticle,
  sourceUrl: string,
  downloadedImages: { localPath: string; originalUrl: string }[],
  slug: string
): string {
  let content = article.content;
  for (const img of downloadedImages) {
    content = content.replaceAll(img.originalUrl, img.localPath);
  }

  const frontmatter: Record<string, string> = {
    title: article.title,
  };
  if (TAG) frontmatter.tag = TAG;
  if (article.author) frontmatter.author = article.author;
  if (article.date) frontmatter.date = article.date;
  frontmatter.source = sourceUrl;

  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
  }
  lines.push("---");
  lines.push("");
  lines.push(content);

  const filePath = path.join(DRAFTS_DIR, `${slug}.md`);
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");

  return filePath;
}

// ── Main ──

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  記事取得 (URL → Markdown)");
  console.log("═══════════════════════════════════════");
  console.log(`\n  URL: ${url}`);

  const page = await fetchPage(url!);

  try {
    let article = await extractFromDom(page, url!);
    article = await llmCleanup(article);

    const slug = CUSTOM_SLUG || generateSlug(article.title);
    console.log(`\n  Slug: ${slug}`);

    // Filter images before downloading
    let imagesToDownload = article.images || [];
    if (FILTER_IMAGES && imagesToDownload.length > 0) {
      console.log(`\n  画像フィルタリング (${imagesToDownload.length}枚)...`);
      const imageInputs: ImageToFilter[] = imagesToDownload.map((url) => ({ url, alt: "" }));

      // Try to use vision model for AI filtering
      const apiKey = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";
      const baseUrl = process.env.LLM_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions";
      const visionModel = process.env.VISION_MODEL || "mimo-v2.5";

      const { kept, rejected } = await filterImages(imageInputs, article.title, {
        useVision: !!apiKey,
        apiKey,
        baseUrl,
        model: visionModel,
      });

      imagesToDownload = kept.map((img) => img.url);
      article.images = imagesToDownload;

      // Remove rejected image references from content
      for (const r of rejected) {
        const imgRegex = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegex(r.image.url)}\\)`, "g");
        article.content = article.content.replace(imgRegex, "");
      }
      article.content = article.content.replace(/\n{3,}/g, "\n\n");

      console.log(`  → 保留: ${kept.length}枚, 除外: ${rejected.length}枚`);
    }

    const downloadedImages = await downloadImages(imagesToDownload, slug, url!);
    const filePath = saveDraft(article, url!, downloadedImages, slug);
    const fileSize = fs.statSync(filePath).size;

    console.log(`\n═══════════════════════════════════════`);
    console.log(`  ✓ 保存完了`);
    console.log(`  ファイル: ${filePath}`);
    console.log(`  サイズ: ${(fileSize / 1024).toFixed(1)}KB`);
    console.log(`  画像: ${downloadedImages.length}枚`);
    console.log(``);
    console.log(`  次のステップ:`);
    console.log(`  1. 内容を確認: vim ${filePath}`);
    console.log(`  2. 発行: ./scripts/publish-blog.sh ${filePath}`);
    console.log(`═══════════════════════════════════════`);
  } finally {
    await page.context().browser()?.close();
  }
}

main().catch((err) => {
  console.error("\n✗ Error:", err.message || err);
  process.exit(1);
});
