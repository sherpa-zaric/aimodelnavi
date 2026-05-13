#!/usr/bin/env tsx

/**
 * generate-blog.ts — Enhanced AI news → Japanese blog pipeline
 *
 * Monitors multiple sources (RSS, JSON APIs), scores relevance/importance,
 * generates opinionated Japanese blog posts, and auto-publishes high-quality content.
 *
 * Sources:
 *   - RSS: OpenAI, Anthropic, Google DeepMind official blogs
 *   - RSS: X/Twitter via RSSHub (OpenAI, AnthropicAI, xAI, GoogleDeepMind, DeepSeek)
 *   - JSON: HackerNews AI stories, Reddit r/LocalLLaMA
 *
 * Quality scoring (1-10 per dimension):
 *   - technical_depth: Is there substantive technical content?
 *   - reader_value: Would a Japanese AI developer find this useful?
 *   - timeliness: Is this breaking news or time-sensitive?
 *   - opinion_potential: Can we add meaningful perspective/analysis?
 *
 * Publish threshold: total >= 28 → auto-publish (draft=false)
 *                    total >= 20 → draft (review recommended)
 *                    total < 20  → skip
 *
 * Usage:
 *   npx tsx scripts/generate-blog.ts
 */

import { saveBlogPost, readDataFile } from "./lib/storage";
import path from "path";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  snippet: string;
  date: string;
}

interface ScoredNews extends NewsItem {
  scores: { technical_depth: number; reader_value: number; timeliness: number; opinion_potential: number };
  total: number;
  angle: string; // suggested writing angle in Japanese
}

interface SourceConfig {
  name: string;
  url: string;
  type: "json" | "rss";
  jsonPath?: string; // for JSON sources, the path to extract items
  headers?: Record<string, string>;
}

// ── Sources ──

const SOURCES: SourceConfig[] = [
  // Official blogs (RSS)
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", type: "rss" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", type: "rss" },
  // Community (JSON APIs)
  { name: "HackerNews AI", url: "https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+language+model&tags=story&hitsPerPage=10", type: "json" },
  { name: "Reddit r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/hot.json?limit=10", type: "json" },
];

// ── RSS parser ──

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Match <item>...</item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        url: link,
        source: "",
        snippet: stripHtml(decodeHtmlEntities(description || "")).slice(0, 300),
        date: pubDate || new Date().toISOString(),
      });
    }
  }
  // Also try <entry> blocks (Atom feed)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractLinkHref(block);
    const summary = extractTag(block, "summary") || extractTag(block, "content");
    const updated = extractTag(block, "updated") || extractTag(block, "published");
    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        url: link,
        source: "",
        snippet: stripHtml(decodeHtmlEntities(summary || "")).slice(0, 300),
        date: updated || new Date().toISOString(),
      });
    }
  }
  return items;
}

function extractTag(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i");
  const match = block.match(regex);
  // Handle CDATA
  if (match) {
    const cdata = match[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    return cdata ? cdata[1] : match[1];
  }
  return null;
}

function extractLinkHref(block: string): string | null {
  const match = block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/i);
  if (match) return match[1];
  // fallback to <link>text</link>
  return extractTag(block, "link");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// ── HTTP helpers ──

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AIModelsNavi/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchRss(url: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AIModelsNavi/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml);
}

// ── News gathering ──

async function gatherNews(): Promise<NewsItem[]> {
  console.log("  Gathering AI news from sources...");
  const allItems: NewsItem[] = [];

  for (const src of SOURCES) {
    try {
      let items: NewsItem[];
      if (src.type === "rss") {
        items = await fetchRss(src.url);
      } else {
        const data = await fetchJson(src.url);
        items = extractJsonItems(data, src);
      }
      // Tag with source name
      for (const item of items) item.source = src.name;
      // Keep last 3 days only
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const recent = items.filter((i) => new Date(i.date).getTime() > cutoff);
      allItems.push(...recent);
      console.log(`  ✓ ${src.name}: ${recent.length} items`);
    } catch (err) {
      console.warn(`  ✗ ${src.name}: ${err}`);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  console.log(`  Total: ${deduped.length} unique items from ${SOURCES.length} sources`);
  return deduped;
}

function extractJsonItems(data: any, src: SourceConfig): NewsItem[] {
  // HackerNews
  if (src.name.includes("HackerNews")) {
    return (data.hits || []).slice(0, 10).map((hit: any) => ({
      title: hit.title || "",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: src.name,
      snippet: (hit.story_text || hit.comment_text || "").slice(0, 300),
      date: hit.created_at || new Date().toISOString(),
    }));
  }
  // Reddit
  if (src.name.includes("Reddit")) {
    return (data.data?.children || []).slice(0, 10).map((post: any) => {
      const p = post.data;
      return {
        title: p.title || "",
        url: p.permalink ? `https://www.reddit.com${p.permalink}` : "",
        source: src.name,
        snippet: (p.selftext || p.title || "").slice(0, 300),
        date: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : new Date().toISOString(),
      };
    });
  }
  return [];
}

// ── AI filtering with quality scoring ──

async function scoreAndFilter(items: NewsItem[]): Promise<ScoredNews[]> {
  console.log(`  Scoring ${items.length} items for relevance and quality...`);

  const { extractFromHTML } = await import("./lib/anthropic");

  const systemPrompt = `You are a Japanese AI news editor for a site called AI Models Navi (aimodelsnavi.com).

Your job: evaluate AI/LLM news items and select the most valuable ones for Japanese developers.

For each item, score on 4 dimensions (1-10):
- technical_depth: Is there substantive technical content? (10 = new model architecture paper)
- reader_value: Would a Japanese AI developer find this actionable or insightful?
- timeliness: Is this breaking news? (10 = just announced today)
- opinion_potential: Can we add meaningful Japanese perspective/analysis?

Also suggest a writing ANGLE in Japanese — what unique perspective should we bring?

Selection criteria:
- FOCUS: New model releases, API changes, benchmark results, major company moves, open-source releases
- IGNORE: Generic AI opinion pieces, non-model news, product marketing fluff

Select up to 3 items with the highest total scores. Minimum total to include: 20.

Respond as JSON array:
[
  {
    "title": "...",
    "url": "...",
    "source": "...",
    "scores": { "technical_depth": N, "reader_value": N, "timeliness": N, "opinion_potential": N },
    "total": N,
    "angle": "Japanese writing angle suggestion"
  }
]

If nothing meets the threshold, return empty array [].`;

  const input = JSON.stringify(items.map(({ title, url, source, snippet, date }) => ({
    title, url, source, snippet: snippet.slice(0, 200), date,
  })));

  try {
    const result = await extractFromHTML<ScoredNews[]>(
      `<news-items>${input}</news-items>`,
      "Array<ScoredNews>",
      systemPrompt
    );
    const valid = result.filter((r) => r.total >= 20);
    console.log(`  ✓ Selected ${valid.length} items (${result.length} scored, ${result.length - valid.length} below threshold)`);
    for (const r of valid) {
      console.log(`    - [${r.total}] ${r.title.slice(0, 70)}`);
    }
    return valid;
  } catch (err) {
    console.warn(`  Scoring failed: ${err}, using top 2 by recency`);
    return items.slice(0, 2).map((item) => ({
      ...item,
      scores: { technical_depth: 6, reader_value: 6, timeliness: 6, opinion_potential: 6 },
      total: 24,
      angle: "AI技術の最新動向を解説",
    }));
  }
}

// ── Generate opinionated blog post ──

async function generateOpinionatedPost(
  item: ScoredNews
): Promise<{ title: string; content: string; excerpt: string; tag: string; draft: string }> {
  const { generateOpinionatedBlogPost, generateBlogPost } = await import("./lib/anthropic");

  try {
    const post = await generateOpinionatedBlogPost(
      item.title,
      item.snippet,
      item.source,
      item.url,
      item.date,
      item.angle,
      item.scores
    );
    const draft = item.total >= 28 ? "false" : "true";
    return { ...post, draft };
  } catch {
    // Fallback: use simpler generation
    const post = await generateBlogPost(item.title, [
      `URL: ${item.url}`,
      `Source: ${item.source}`,
      `Date: ${item.date}`,
      `Content: ${item.snippet}`,
    ]);
    return { ...post, draft: "true" };
  }
}

// ── Dedup tracking ──

function loadPublishedUrls(): Set<string> {
  const seen = new Set<string>();
  // Check existing blog posts for source URLs
  const blogDir = path.join(process.cwd(), "src/content/blog");
  try {
    const fs = require("fs");
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
      const match = content.match(/source:\s*"?([^"\n]+)"?/);
      if (match) seen.add(match[1].trim());
    }
  } catch { /* ignore */ }
  return seen;
}

// ── Main ──

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  ブログ記事生成 (Enhanced)");
  console.log("═══════════════════════════════════════\n");

  // Step 1: Gather
  const allNews = await gatherNews();
  if (allNews.length === 0) {
    console.log("  No news found. Exiting.");
    return;
  }

  // Step 2: Filter already-published
  const publishedUrls = loadPublishedUrls();
  const newNews = allNews.filter((item) => !publishedUrls.has(item.url));
  const skipped = allNews.length - newNews.length;
  if (skipped > 0) console.log(`  Skipped ${skipped} already-published items`);
  if (newNews.length === 0) {
    console.log("  All items already published. Exiting.");
    return;
  }

  // Step 3: Score & filter
  const scored = await scoreAndFilter(newNews);
  if (scored.length === 0) {
    console.log("  No items met quality threshold. Exiting.");
    return;
  }

  // Step 4: Generate posts
  for (const item of scored) {
    console.log(`\n  ───`);
    console.log(`  [${item.total}/40] ${item.title.slice(0, 80)}`);
    console.log(`  Source: ${item.source} | Angle: ${item.angle}`);

    try {
      const post = await generateOpinionatedPost(item);

      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      saveBlogPost(slug, {
        title: post.title,
        date: item.date.split("T")[0] || new Date().toISOString().split("T")[0],
        tag: post.tag || "解説",
        excerpt: post.excerpt || "",
        source: item.url,
        draft: post.draft,
      }, post.content);

      const status = post.draft === "false" ? "📢 AUTO-PUBLISHED" : "📝 DRAFT";
      console.log(`  ✓ ${status} → ${slug}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }

  const autoPublished = scored.filter((s) => s.total >= 28).length;
  const drafts = scored.length - autoPublished;
  console.log(`\n=== 完了: ${autoPublished} 自動公開, ${drafts} 下書き ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
