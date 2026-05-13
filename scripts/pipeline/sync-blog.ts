/**
 * Blog sync pipeline stage.
 *
 * Reads newly crawled blog articles from the blog_posts table,
 * extracts and downloads images, processes articles via LLM
 * (Chinese → Japanese translation + adaptation), and saves as Markdown.
 */

import { migrate, getSourceId, getBlogPostsNeedingProcessing, markBlogPostProcessed } from "../lib/db";
import { processBlogArticle } from "../lib/anthropic";
import { saveBlogPost } from "../lib/storage";
import { rateLimitedFetch } from "../lib/http";
import fs from "fs";
import path from "path";

interface BlogImage {
  src: string;      // original URL
  alt: string;
  localPath: string; // local path for markdown
}

export interface BlogSyncResult {
  processed: number;
  skipped: number;
  errors: string[];
}

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public", "images", "blog");

function extractImages(html: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Only include article images (skip icons, logos, etc.)
    if (src.includes("blog_images") || src.includes("resources")) {
      images.push({ src, alt: match[2] || "" });
    }
  }
  return images;
}

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

      // Extract and download images from the original article
      const images: BlogImage[] = [];
      try {
        const { body } = await rateLimitedFetch(post.source_url);
        const rawImages = extractImages(body);
        const imageDir = path.join(PUBLIC_IMAGES_DIR, post.local_slug || post.external_slug);

        for (let j = 0; j < Math.min(rawImages.length, 5); j++) {
          const img = rawImages[j];
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
          console.log(`    Downloaded ${images.length} images`);
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

      saveBlogPost(
        localSlug,
        {
          title: blogPost.title,
          date: new Date().toISOString().split("T")[0],
          tag: blogPost.tag,
          excerpt: blogPost.excerpt,
          draft: "true",
        },
        blogPost.content
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
