/**
 * Blog sync pipeline stage.
 *
 * Reads newly crawled blog articles from the blog_posts table,
 * extracts and downloads images (filtering out promotional/Chinese-text images),
 * processes articles via LLM (Chinese → Japanese translation + adaptation),
 * and saves as Markdown.
 */

import { migrate, getSourceId, getBlogPostsNeedingProcessing, markBlogPostProcessed } from "../lib/db";
import { processBlogArticle } from "../lib/anthropic";
import { saveBlogPost } from "../lib/storage";
import { rateLimitedFetch } from "../lib/http";
import fs from "fs";
import path from "path";

interface BlogImage {
  src: string;
  alt: string;
  localPath: string;
}

export interface BlogSyncResult {
  processed: number;
  skipped: number;
  errors: string[];
}

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public", "images", "blog");

// ── Image extraction from HTML ──

function extractImages(html: string): { src: string; alt: string; context: string }[] {
  const images: { src: string; alt: string; context: string }[] = [];
  // Match both src and data-src (lazy loading images)
  const imgRegex = /<img[^>]*\b(?:src|data-src)="([^"]+)"[^>]*(?:\balt="([^"]*)")?[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Skip: logos, icons, avatars, base64 data URIs and non-image URLs
    if (
      src.startsWith("data:") ||
      src.includes("logo") ||
      src.includes("avatar") ||
      src.includes("favicon") ||
      src.includes("icon-") ||
      src.includes("author-") ||
      src.endsWith(".svg") ||
      src.endsWith(".ico")
    ) continue;

    // Accept any images that have image-like extensions or known CDNs
    const isImage = /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(src) ||
      /mmbiz\.qpic\.cn|images\.unsplash\.com|pbs\.twimg\.com|imgur\.com|cloudinary\.com|cdn\.openai\.com|blog_images|resources/i.test(src);

    if (isImage) {
      const idx = match.index;
      const context = html.slice(Math.max(0, idx - 100), idx + 300);
      images.push({ src, alt: match[2] || "", context });
    }
  }
  return images;
}

// ── Heuristic promo filter (fast, no API calls) ──

const PROMO_KEYWORDS = [
  "微信", "公众号", "扫码", "关注", "二维码", "读者群",
  "wechat", "QR", "qrcode", "订阅", "加群", "客服",
  "点赞", "在看", "转发", "分享", "推广", "广告",
  "长按", "识别", "海报", "福利", "领取", "限时",
];

const PROMO_URL_PATTERNS = [
  "wechat", "qrcode", "qr-code", "promotion", "banner", "ad-",
  "mpmenu", "reward", "like-author",
];

function isPromoByHeuristic(alt: string, src: string): boolean {
  const lowerAlt = alt.toLowerCase();
  const lowerSrc = src.toLowerCase();

  // Check alt text for promo keywords
  for (const kw of PROMO_KEYWORDS) {
    if (lowerAlt.includes(kw)) return true;
  }

  // Check URL for promo patterns
  for (const pat of PROMO_URL_PATTERNS) {
    if (lowerSrc.includes(pat)) return true;
  }

  // Image without alt text and with generic name is suspicious
  if (!alt && (src.includes("img-") || src.includes("image-"))) return false; // generic names are OK

  return false;
}

// ── AI-based image filter (Gemma4 vision model) ──

const VISION_MODEL = "gemma3:27b-cloud";

async function analyzeImageWithVision(
  imageUrl: string,
  imageAlt: string,
  articleTitle: string
): Promise<"promo" | "chinese_text" | "content"> {
  const key = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const baseUrl = process.env.LLM_BASE_URL || "https://ollama.com/v1/chat/completions";

  try {
    // Download image and convert to base64
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "AIModelsNavi/1.0" },
    });
    if (!imgRes.ok) return "content"; // can't download, assume OK
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const b64 = buf.toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/webp";

    const prompt = `Analyze this image from a Chinese AI blog article titled "${articleTitle}" (alt text: "${imageAlt}").

Classify as one of:
- "promo": WeChat/微信公众号 QR code, subscription banner, "scan to follow", reader group invite, DataLearnerAI self-promotion, or advertisement
- "chinese_text": contains Chinese text but appears to be a content image (infographic, diagram, chart, screenshot with Chinese labels)
- "content": purely technical content (chart, diagram, architecture, benchmark results, photo) — no Chinese text at all

Respond with EXACTLY one word: promo, chinese_text, or content.`;

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 32,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${b64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) return "content";
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const answer = data.choices[0].message.content.toLowerCase().trim();

    if (answer.includes("promo")) return "promo";
    if (answer.includes("chinese")) return "chinese_text";
    return "content";
  } catch {
    return "content"; // on error, keep the image
  }
}

async function filterImagesByAI(
  images: { src: string; alt: string; context: string }[],
  articleTitle: string
): Promise<{ src: string; alt: string }[]> {
  if (images.length === 0) return [];

  // First pass: heuristic filter
  const heuristicKeep: typeof images = [];
  const heuristicReject: string[] = [];
  for (const img of images) {
    if (isPromoByHeuristic(img.alt, img.src)) {
      heuristicReject.push(img.alt || img.src);
    } else {
      heuristicKeep.push(img);
    }
  }

  if (heuristicReject.length > 0) {
    console.log(`    Heuristic: rejected ${heuristicReject.length} promo images`);
  }

  if (heuristicKeep.length === 0) return [];

  // Second pass: Gemma4 vision analysis for each image
  console.log(`    Vision AI: analyzing ${heuristicKeep.length} images...`);
  const result: { src: string; alt: string }[] = [];
  let rejected = 0;

  for (const img of heuristicKeep) {
    const classification = await analyzeImageWithVision(img.src, img.alt, articleTitle);
    if (classification === "promo" || classification === "chinese_text") {
      const reason = classification === "promo" ? "promo" : "chinese text";
      console.log(`      ✗ ${reason}: ${img.alt || img.src.split("/").pop()}`);
      rejected++;
    } else {
      console.log(`      ✓ content: ${img.alt || img.src.split("/").pop()}`);
      result.push({ src: img.src, alt: img.alt });
    }
  }

  if (rejected > 0) {
    console.log(`    Vision AI: rejected ${rejected} promo, kept ${result.length}`);
  }

  return result;
}

// ── Image download ──

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AIModelsNavi/1.0" },
    });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

// ── Main ──

export async function syncBlog(): Promise<BlogSyncResult> {
  migrate();
  const sourceId = getSourceId("blog");

  const result: BlogSyncResult = { processed: 0, skipped: 0, errors: [] };

  const posts = getBlogPostsNeedingProcessing(sourceId);
  if (posts.length === 0) {
    console.log("\n[Blog Sync] No new blog posts to process.");
    return result;
  }

  const MAX_ARTICLES_PER_RUN = 5;
  const toProcess = posts.slice(0, MAX_ARTICLES_PER_RUN);
  const remaining = posts.length - toProcess.length;

  console.log(`\n═══ Blog Sync: Processing ${toProcess.length} articles (${posts.length} total, ${remaining} queued) ═══`);

  for (let i = 0; i < toProcess.length; i++) {
    const post = toProcess[i];
    console.log(`\n  [${i + 1}/${toProcess.length}] ${post.title_zh || post.external_slug}`);

    try {
      const bodyText = post.body_text;
      if (!bodyText || bodyText.length < 100) {
        result.skipped++;
        console.warn(`  ✗ Body text too short (${bodyText?.length || 0} chars), skipping`);
        continue;
      }

      // Extract, filter, and download images
      const images: BlogImage[] = [];
      try {
        const { body } = await rateLimitedFetch(post.source_url);
        const rawImages = extractImages(body);

        // Filter images: heuristic + AI (Gemma)
        const filtered = await filterImagesByAI(
          rawImages,
          post.title_zh || post.external_slug
        );

        // Download filtered images
        const imageDir = path.join(PUBLIC_IMAGES_DIR, post.local_slug || post.external_slug);

        for (let j = 0; j < Math.min(filtered.length, 5); j++) {
          const img = filtered[j];
          const ext = img.src.match(/\.(webp|png|jpg|jpeg)(\?|$)/i)?.[1] || "webp";
          const filename = `img-${j + 1}.${ext}`;
          const localPath = `/images/blog/${post.local_slug || post.external_slug}/${filename}`;
          const fullPath = path.join(imageDir, filename);

          const ok = await downloadImage(img.src, fullPath);
          if (ok) {
            images.push({ src: img.src, alt: img.alt, localPath });
          }
        }
        if (images.length > 0) {
          console.log(`    Downloaded ${images.length} images (${rawImages.length - filtered.length} filtered out)`);
        }
      } catch {
        console.warn("    Image extraction skipped (fetch failed)");
      }

      // Process via LLM: translate Chinese → Japanese + adapt for Japanese audience
      const blogPost = await processBlogArticle(
        post.title_zh || post.external_slug,
        bodyText,
        post.source_url,
        images
      );

      const localSlug = post.local_slug || post.external_slug.slice(0, 80);

      // Post-processing: verify images are in the output, add if missing
      let finalContent = blogPost.content;
      if (images.length > 0) {
        const imagesInContent = (finalContent.match(/!\[[^\]]*\]\(/g) || []).length;
        if (imagesInContent < images.length) {
          console.log(`    ⚠ LLM included ${imagesInContent}/${images.length} images — adding missing ones`);
          // Insert missing images at section breaks
          const missingImages = images.filter(
            (img) => !finalContent.includes(img.localPath)
          );
          if (missingImages.length > 0) {
            const sections = finalContent.split(/\n(?=## )/g);
            for (let k = 0; k < missingImages.length; k++) {
              const insertIdx = Math.min(k + 1, sections.length - 1);
              sections[insertIdx] = `\n![](${missingImages[k].localPath})\n` + sections[insertIdx];
            }
            finalContent = sections.join("\n\n");
          }
        }
      }

      saveBlogPost(
        localSlug,
        {
          title: blogPost.title,
          date: new Date().toISOString().split("T")[0],
          tag: blogPost.tag,
          excerpt: blogPost.excerpt,
          draft: "true",
        },
        finalContent
      );

      markBlogPostProcessed(post.id, localSlug);
      result.processed++;
      console.log(`  ✓ ${blogPost.title}`);
    } catch (err) {
      result.errors.push(`${post.external_slug}: ${err}`);
      console.error(`  ✗ Failed: ${err}`);
    }
  }

  console.log(`\n  Blog sync done: ${result.processed} processed, ${result.skipped} skipped, ${result.errors.length} errors`);
  return result;
}
