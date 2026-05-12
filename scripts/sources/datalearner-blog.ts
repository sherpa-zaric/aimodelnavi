/**
 * DataLearnerAI blog crawler source.
 * Crawls blog listing and detail pages, extracts article content for AI processing.
 */

import {
  getDb,
  migrate,
  getSourceId,
  startCrawlLog,
  endCrawlLog,
  upsertBlogPost,
  getExistingBlogSlugs,
  contentHash,
} from "../lib/db";
import { rateLimitedFetch } from "../lib/http";

const BASE_URL = "https://www.datalearner.com";
const BLOG_LIST_URL = `${BASE_URL}/blog_list`;

interface BlogArticleMeta {
  slug: string;
  url: string;
  title: string;
  date: string;
  tags: string[];
}

interface BlogArticleContent {
  title: string;
  date: string;
  tags: string[];
  bodyHtml: string;
  bodyText: string;
}

// ── Extract article links from blog list page ──

function extractArticleLinks(html: string): BlogArticleMeta[] {
  const articles: BlogArticleMeta[] = [];

  // Match blog article links with title and date
  // Pattern: <a href="/blog/slug">...title...</a> ... date pattern
  const linkPattern = /<a[^>]*href="(\/blog\/([^"]+))"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const slug = match[2];
    const title = match[3].trim();

    // Skip non-article links (pagination, sidebar, etc.)
    if (
      slug.includes("page/") ||
      slug === "blog_list" ||
      title.length < 10 ||
      slug.match(/^\d+$/) // numeric IDs (sidebar popular posts)
    ) {
      continue;
    }

    if (!articles.find((a) => a.slug === slug)) {
      articles.push({
        slug,
        url: `${BASE_URL}${href}`,
        title,
        date: "",
        tags: [],
      });
    }
  }

  return articles;
}

function extractDates(html: string): Map<string, string> {
  const dates = new Map<string, string>();
  // Date pattern in blog list: datetime="YYYY/MM/DD HH:mm:ss" or text node with date
  const datePattern = /datetime="([^"]+)"/g;
  const slugPattern = /href="\/blog\/([^"]+)"/g;

  const slugs: string[] = [];
  let m;
  while ((m = slugPattern.exec(html)) !== null) {
    slugs.push(m[1]);
  }

  const dateStrs: string[] = [];
  let dm;
  while ((dm = datePattern.exec(html)) !== null) {
    dateStrs.push(dm[1]);
  }

  // Match slugs to dates by position
  for (let i = 0; i < Math.min(slugs.length, dateStrs.length); i++) {
    dates.set(slugs[i], dateStrs[i]);
  }

  return dates;
}

// ── Extract article content from detail page ──

function extractArticleContent(html: string): BlogArticleContent {
  // Extract title (H1)
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch?.[1]?.trim() || "";

  // Extract date
  const dateMatch = html.match(/datetime="([^"]+)"/);
  const date = dateMatch?.[1] || "";

  // Extract tags
  const tags: string[] = [];
  const tagPattern = /<a[^>]*href="\/blog_list\?tag=([^"]+)"[^>]*>/gi;
  let tm;
  while ((tm = tagPattern.exec(html)) !== null) {
    tags.push(tm[1]);
  }

  // Extract body HTML (article content area)
  let bodyHtml = "";
  const articleMatch = html.match(
    /<article[^>]*>([\s\S]*?)<\/article>/i
  );
  if (articleMatch) {
    bodyHtml = articleMatch[1];
  } else {
    // Fallback: try to get main content area
    const mainMatch = html.match(
      /<(?:div|section)[^>]*class="[^"]*(?:content|article|blog-detail|post-body)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i
    );
    if (mainMatch) {
      bodyHtml = mainMatch[1];
    } else {
      bodyHtml = html;
    }
  }

  // Extract clean text from body
  const bodyText = bodyHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<img[^>]*>/gi, "[画像]")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return { title, date, tags, bodyHtml, bodyText };
}

// ── Main Crawl Function ──

export interface BlogCrawlResult {
  listPagesCrawled: number;
  totalArticles: number;
  newArticles: number;
  errors: string[];
}

export async function crawlDataLearnerBlog(
  mode: "full" | "incremental"
): Promise<BlogCrawlResult> {
  migrate();
  const db = getDb();
  const sourceId = getSourceId("blog");

  const result: BlogCrawlResult = {
    listPagesCrawled: 0,
    totalArticles: 0,
    newArticles: 0,
    errors: [],
  };

  const maxListPages = mode === "full" ? 40 : 1;
  const allArticles: BlogArticleMeta[] = [];

  console.log(`\n[DataLearnerAI Blog] Crawling blog list (${mode} mode, up to ${maxListPages} pages)...`);

  // Step 1: Crawl blog list pages
  for (let page = 1; page <= maxListPages; page++) {
    const url = page === 1 ? BLOG_LIST_URL : `${BLOG_LIST_URL}/page/${page}`;
    const logId = startCrawlLog(sourceId, url, mode);

    try {
      const { body, status } = await rateLimitedFetch(url);
      const articles = extractArticleLinks(body);

      if (articles.length === 0) {
        // Empty page = reached end of pagination (in full mode)
        endCrawlLog(logId, status, contentHash(body.slice(0, 5000)), null);
        console.log(`  Page ${page}: empty, stopping pagination`);
        break;
      }

      // Extract dates and attach to articles
      const dates = extractDates(body);
      for (const article of articles) {
        const date = dates.get(article.slug);
        if (date) article.date = date;
      }

      allArticles.push(...articles);
      result.listPagesCrawled++;
      endCrawlLog(logId, status, contentHash(body.slice(0, 5000)), null);
      console.log(`  Page ${page}: ${articles.length} articles`);
    } catch (err) {
      endCrawlLog(logId, 0, null, String(err));
      result.errors.push(`List page ${page}: ${err}`);
      console.warn(`  Page ${page} failed: ${err}`);
      if (mode === "incremental") break;
    }
  }

  // Deduplicate by slug (same article may appear if list re-sorts)
  const seen = new Set<string>();
  const uniqueArticles = allArticles.filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });
  result.totalArticles = uniqueArticles.length;

  // Step 2: Identify new articles
  const existingSlugs = getExistingBlogSlugs(sourceId);
  const newArticles = uniqueArticles.filter((a) => !existingSlugs.has(a.slug));
  result.newArticles = newArticles.length;

  console.log(
    `  Total: ${uniqueArticles.length} articles, ${newArticles.length} new`
  );

  // Step 3: Fetch and store new article content
  if (newArticles.length > 0) {
    console.log(`  Fetching ${newArticles.length} new article detail pages...`);

    for (let i = 0; i < newArticles.length; i++) {
      const article = newArticles[i];
      const logId = startCrawlLog(sourceId, article.url, mode);

      try {
        const { body, status } = await rateLimitedFetch(article.url);
        const content = extractArticleContent(body);

        const hash = contentHash(
          content.bodyText.slice(0, 2000) + content.title
        );

        // Generate local slug from title or external slug
        const localSlug = article.slug.slice(0, 80);

        upsertBlogPost({
          sourceId,
          externalSlug: article.slug,
          sourceUrl: article.url,
          titleZh: content.title || article.title,
          bodyText: content.bodyText,
          contentHash: hash,
          localSlug,
        });

        endCrawlLog(logId, status, contentHash(body.slice(0, 5000)), null);
        console.log(
          `  ${i + 1}/${newArticles.length} ${content.title || article.title}`
        );
      } catch (err) {
        endCrawlLog(logId, 0, null, String(err));
        result.errors.push(`${article.slug}: ${err}`);
        console.warn(`  ${i + 1}/${newArticles.length} ${article.slug}: failed - ${err}`);
      }
    }
  }

  console.log(
    `  Done: ${result.listPagesCrawled} list pages, ${result.newArticles} new articles stored`
  );

  return result;
}
