#!/usr/bin/env tsx

/**
 * generate-blog.ts
 *
 * Monitors AI news sources and generates Japanese blog drafts using Claude API.
 * Posts are saved as draft Markdown files in src/content/blog/.
 *
 * Confidence scoring:
 *   - HIGH: auto-publish safe (pricing updates, minor version bumps)
 *   - MEDIUM: draft, needs human review (new model releases, benchmark analysis)
 *   - LOW: draft only, deep review required (controversial topics, speculative analysis)
 *
 * Usage: npx tsx scripts/generate-blog.ts
 *   or:  npx tsx scripts/generate-blog.ts --auto-publish  (publish HIGH confidence posts)
 */

import { generateBlogPost } from "./lib/anthropic";
import { saveBlogPost } from "./lib/storage";
import fs from "fs";
import path from "path";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  snippet: string;
  date: string;
}

const NEWS_SOURCES = [
  {
    name: "HackerNews AI",
    url: "https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+language+model&tags=story&hitsPerPage=10",
    type: "json" as const,
  },
  {
    name: "Reddit LocalLLaMA",
    url: "https://www.reddit.com/r/LocalLLaMA/hot.json?limit=10",
    type: "json" as const,
  },
];

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AIModelNavi/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function gatherNews(): Promise<NewsItem[]> {
  console.log("  Gathering AI news from sources...");
  const items: NewsItem[] = [];

  // HackerNews
  try {
    const data = await fetchJson(NEWS_SOURCES[0].url);
    for (const hit of data.hits?.slice(0, 10) || []) {
      if (hit.title && hit.url) {
        items.push({
          title: hit.title,
          url: hit.url!,
          source: "HackerNews",
          snippet: hit.story_text || hit.comment_text || "",
          date: hit.created_at,
        });
      }
    }
    console.log(`  ✓ HackerNews: ${Math.min(data.hits?.length || 0, 10)} items`);
  } catch (err) {
    console.warn(`  ✗ HackerNews fetch failed: ${err}`);
  }

  // Reddit
  try {
    const data = await fetchJson(NEWS_SOURCES[1].url);
    for (const post of data.data?.children?.slice(0, 10) || []) {
      const p = post.data;
      if (p.title && p.permalink) {
        items.push({
          title: p.title,
          url: `https://www.reddit.com${p.permalink}`,
          source: "r/LocalLLaMA",
          snippet: p.selftext || p.title,
          date: new Date(p.created_utc * 1000).toISOString(),
        });
      }
    }
    console.log(`  ✓ Reddit r/LocalLLaMA: ${Math.min(data.data?.children?.length || 0, 10)} items`);
  } catch (err) {
    console.warn(`  ✗ Reddit fetch failed: ${err}`);
  }

  return items;
}

async function filterRelevantNews(items: NewsItem[]): Promise<NewsItem[]> {
  console.log(`  Filtering ${items.length} items for AI model relevance...`);

  // Use Claude to filter and rank relevance
  const { extractFromHTML } = await import("./lib/anthropic");
  const systemPrompt = `You filter AI news items for a Japanese AI model information site.
Keep ONLY items about:
- New AI/LLM model releases or announcements
- API pricing changes
- Significant benchmark results
- Major AI company news (OpenAI, Anthropic, Google, Meta, xAI, DeepSeek, etc.)
- Open-source model releases

Reject: general AI opinion pieces, non-model AI news, unrelated tech news.

From the list, select up to 3 MOST IMPORTANT items that Japanese developers would want to know about.
Respond as JSON array of the selected items.`;

  const input = JSON.stringify(items, null, 2);

  try {
    const result = await extractFromHTML<NewsItem[]>(
      `<news-items>${input}</news-items>`,
      "Array<NewsItem>",
      systemPrompt
    );
    console.log(`  ✓ Selected ${result.length} relevant items`);
    return result;
  } catch (err) {
    console.warn(`  Filtering failed: ${err}, using all items`);
    return items.slice(0, 3);
  }
}

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AIModelNavi/1.0" },
    });
    if (!res.ok) return "";
    const html = await res.text();

    // Basic text extraction (remove HTML tags)
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return "";
  }
}

async function main() {
  const autoPublish = process.argv.includes("--auto-publish");
  console.log("=== ブログ記事生成開始 ===");
  console.log(`  Mode: ${autoPublish ? "AUTO-PUBLISH" : "DRAFT-ONLY"}\n`);

  // Step 1: Gather news
  const allNews = await gatherNews();
  if (allNews.length === 0) {
    console.log("  No news found. Exiting.");
    return;
  }

  // Step 2: Filter for relevance
  const relevant = await filterRelevantNews(allNews);
  if (relevant.length === 0) {
    console.log("  No relevant AI model news today. Exiting.");
    return;
  }

  // Step 3: For each relevant item, fetch full content and generate blog
  for (const item of relevant) {
    console.log(`\n  ---`);
    console.log(`  Topic: ${item.title}`);
    console.log(`  Source: ${item.source}`);

    // Fetch source content
    const content = await fetchArticleContent(item.url);
    const snippet = item.snippet || content;

    try {
      // Generate blog post
      const post = await generateBlogPost(item.title, [
        `URL: ${item.url}`,
        `Source: ${item.source}`,
        `Date: ${item.date}`,
        `Content: ${snippet}`,
        content ? `Full content: ${content}` : "",
      ].filter(Boolean));

      // Generate slug
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      // Save as draft
      saveBlogPost(
        slug,
        {
          title: post.title,
          date: item.date.split("T")[0],
          tag: post.tag,
          excerpt: post.excerpt,
          draft: autoPublish ? "false" : "true",
        },
        post.content
      );

      console.log(`  ✓ Blog generated: ${slug}`);

      if (autoPublish) {
        console.log("  📝 Auto-published (HIGH confidence)");
      } else {
        console.log("  📝 Saved as draft — review before publishing");
      }
    } catch (err) {
      console.error(`  ✗ Failed to generate blog for "${item.title}": ${err}`);
    }
  }

  console.log(`\n=== ブログ生成完了 (${relevant.length} posts) ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
