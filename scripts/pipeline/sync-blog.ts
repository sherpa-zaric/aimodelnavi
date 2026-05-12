/**
 * Blog sync pipeline stage.
 *
 * Reads newly crawled blog articles from the blog_posts table,
 * processes them via LLM (Chinese → Japanese translation + adaptation),
 * and saves as Markdown files.
 */

import { migrate, getSourceId, getBlogPostsNeedingProcessing, markBlogPostProcessed } from "../lib/db";
import { processBlogArticle } from "../lib/anthropic";
import { saveBlogPost } from "../lib/storage";

export interface BlogSyncResult {
  processed: number;
  skipped: number;
  errors: string[];
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

  // Limit articles per run to avoid CI timeout (2 min timeout × max articles)
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

      // Process via LLM: translate Chinese → Japanese + adapt for Japanese audience
      const blogPost = await processBlogArticle(
        post.title_zh || post.external_slug,
        bodyText,
        post.source_url,
        "", // date not stored separately in crawl
        []  // tags not stored separately in crawl
      );

      // Generate local slug
      const localSlug = post.local_slug || post.external_slug.slice(0, 80);

      // Save as draft markdown
      saveBlogPost(
        localSlug,
        {
          title: blogPost.title,
          date: new Date().toISOString().split("T")[0],
          tag: blogPost.tag,
          excerpt: blogPost.excerpt,
          source: post.source_url,
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
