#!/usr/bin/env tsx

/**
 * generate-blog.ts — AI-powered blog generation pipeline with fact-checking
 *
 * Pipeline:
 *   1. Discover  — Gather AI news from RSS/JSON sources
 *   2. Score      — AI evaluates relevance and quality
 *   3. Research   — Fetch original source, extract key facts
 *   4. Write      — Generate article based on researched facts
 *   5. Validate   — Fact-check claims against source data
 *   6. Revise     — Fix issues if validation fails (max 2 attempts)
 *   7. Publish    — Save and optionally trigger publish-blog.sh
 *
 * Usage:
 *   npx tsx scripts/generate-blog.ts                    # full pipeline
 *   npx tsx scripts/generate-blog.ts --publish          # auto-publish via GitHub Actions
 *   npx tsx scripts/generate-blog.ts --dry-run          # score only, no writing
 *   npx tsx scripts/generate-blog.ts --topic "..."      # skip discovery, use given topic
 */

import fs from "fs";
import path from "path";
import { callLLM } from "./lib/anthropic";
import { fetchSources, formatResearchForLLM, htmlToText, type ResearchSource } from "./lib/research";

// ── CLI args ──

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const AUTO_PUBLISH = args.includes("--publish");
const topicIdx = args.indexOf("--topic");
const GIVEN_TOPIC = topicIdx !== -1 ? args[topicIdx + 1] : null;

// ── Types ──

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
  angle: string;
}

interface ArticleDraft {
  title: string;
  tag: string;
  excerpt: string;
  body: string;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

interface SourceConfig {
  name: string;
  url: string;
  type: "json" | "rss";
}

// ── Sources ──

const SOURCES: SourceConfig[] = [
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", type: "rss" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", type: "rss" },
  { name: "HackerNews AI", url: "https://hn.algolia.com/api/v1/search_by_date?query=AI+LLM+language+model&tags=story&hitsPerPage=10", type: "json" },
  { name: "Reddit r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/hot.json?limit=10", type: "json" },
];

// ── RSS parser ──

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
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
        title: decodeEntities(title),
        url: link,
        source: "",
        snippet: stripHtml(decodeEntities(description || "")).slice(0, 300),
        date: pubDate || new Date().toISOString(),
      });
    }
  }
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractLinkHref(block);
    const summary = extractTag(block, "summary") || extractTag(block, "content");
    const updated = extractTag(block, "updated") || extractTag(block, "published");
    if (title && link) {
      items.push({
        title: decodeEntities(title),
        url: link,
        source: "",
        snippet: stripHtml(decodeEntities(summary || "")).slice(0, 300),
        date: updated || new Date().toISOString(),
      });
    }
  }
  return items;
}

function extractTag(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(regex);
  if (m) {
    const cdata = m[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    return cdata ? cdata[1] : m[1];
  }
  return null;
}

function extractLinkHref(block: string): string | null {
  const m = block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/i);
  if (m) return m[1];
  return extractTag(block, "link");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

// ── HTTP helpers ──

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": "AIModelsNavi/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchRss(url: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AIModelsNavi/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseRss(await res.text());
}

// ── Step 1: Gather news ──

async function gatherNews(): Promise<NewsItem[]> {
  console.log("  Gathering AI news...");
  const allItems: NewsItem[] = [];

  for (const src of SOURCES) {
    try {
      let items: NewsItem[];
      if (src.type === "rss") {
        items = await fetchRss(src.url);
      } else {
        items = extractJsonItems(await fetchJson(src.url), src);
      }
      for (const item of items) item.source = src.name;
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const recent = items.filter((i) => new Date(i.date).getTime() > cutoff);
      allItems.push(...recent);
      console.log(`    ✓ ${src.name}: ${recent.length} items`);
    } catch (err) {
      console.warn(`    ✗ ${src.name}: ${err}`);
    }
  }

  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  console.log(`  Total: ${deduped.length} unique items`);
  return deduped;
}

function extractJsonItems(data: any, src: SourceConfig): NewsItem[] {
  if (src.name.includes("HackerNews")) {
    return (data.hits || []).slice(0, 10).map((hit: any) => ({
      title: hit.title || "",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: src.name,
      snippet: (hit.story_text || hit.comment_text || "").slice(0, 300),
      date: hit.created_at || new Date().toISOString(),
    }));
  }
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

// ── Step 2: Score and filter ──

async function scoreAndFilter(items: NewsItem[]): Promise<ScoredNews[]> {
  console.log(`\n  Scoring ${items.length} items...`);

  const system = `You are a Japanese AI news editor for aimodelsnavi.com.
Evaluate AI/LLM news items for Japanese developers.

Score each item (1-10):
- technical_depth: Substantive technical content?
- reader_value: Actionable for Japanese AI developers?
- timeliness: Breaking news?
- opinion_potential: Can we add meaningful analysis?

Select up to 3 items with total >= 20. Suggest a writing ANGLE in Japanese.

Respond as JSON array:
[{"title":"...","url":"...","source":"...","scores":{"technical_depth":N,"reader_value":N,"timeliness":N,"opinion_potential":N},"total":N,"angle":"..."}]

If nothing meets threshold, return [].`;

  const input = JSON.stringify(items.map(({ title, url, source, snippet, date }) => ({
    title, url, source, snippet: snippet.slice(0, 200), date,
  })));

  try {
    const result = await callLLM(system, input, 2048);
    const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const valid = (Array.isArray(parsed) ? parsed : []).filter((r: any) => r.total >= 20);
    console.log(`  Selected ${valid.length} items`);
    valid.forEach((r: ScoredNews) => console.log(`    [${r.total}] ${r.title.slice(0, 70)}`));
    return valid;
  } catch (err) {
    console.warn(`  Scoring failed: ${err}`);
    return [];
  }
}

// ── Step 3: Research (NEW) ──

async function researchTopic(item: ScoredNews): Promise<{ facts: string; sources: ResearchSource[] }> {
  console.log(`\n═══ Research: ${item.title.slice(0, 60)} ═══\n`);

  // Fetch the original source URL
  const sources = await fetchSources([item.url], 12000);

  // Also try to find additional authoritative sources
  const additionalUrls: string[] = [];
  if (item.title.toLowerCase().includes("anthropic") || item.title.toLowerCase().includes("claude")) {
    additionalUrls.push("https://www.anthropic.com/news");
  }
  if (item.title.toLowerCase().includes("openai") || item.title.toLowerCase().includes("gpt")) {
    additionalUrls.push("https://openai.com/blog");
  }
  if (item.title.toLowerCase().includes("google") || item.title.toLowerCase().includes("gemini")) {
    additionalUrls.push("https://blog.google/technology/ai/");
  }

  if (additionalUrls.length > 0) {
    const extra = await fetchSources(additionalUrls, 5000);
    sources.push(...extra);
  }

  if (sources.length === 0) {
    console.warn("  No sources fetched, using snippet only");
    return {
      facts: `Title: ${item.title}\nSnippet: ${item.snippet}\nURL: ${item.url}`,
      sources: [],
    };
  }

  // Extract key facts with LLM
  console.log("  Extracting key facts...");
  const researchText = formatResearchForLLM(sources);

  const system = `Extract key facts from these sources for a blog article.
Focus on:
- Specific numbers (revenue, users, benchmark scores, prices)
- Official product names, company names, person names
- Dates and timelines
- Important quotes
- Comparison data with competitors

Mark each fact with [Source N]. Output as Markdown list.`;

  const facts = await callLLM(system, researchText, 2048);
  console.log(`  Extracted ${facts.length} chars of facts`);

  return { facts, sources };
}

// ── Step 4: Write article (ENHANCED with research) ──

async function writeArticle(
  item: ScoredNews,
  research: { facts: string; sources: ResearchSource[] }
): Promise<ArticleDraft> {
  console.log(`\n═══ Writing Article ═══\n`);

  const tags = "OpenAI, Anthropic, Google, オープンソース, ベンチマーク, チュートリアル, AIエージェント, xAI, DeepSeek, 解説, 速報, 料金比較";

  const system = `You are a technical blog writer for aimodelsnavi.com (Japanese AI model comparison site).
Write a Japanese blog article based on the research facts provided.

Rules:
1. Use ONLY facts from the research. No speculation or fabrication.
2. Cite sources when referencing data (e.g., "○○によると")
3. For uncertain info, use hedging language ("とされる", "reportedly")
4. Add a "参考" section listing source URLs at the end
5. Do NOT include H1 heading (frontmatter title is used)
6. 1500-2500 characters, structured with H2 headings
7. Professional but accessible tone for Japanese developers

Available tags: ${tags}

Respond as JSON:
{"title":"SEO-friendly Japanese title","tag":"one tag from list","excerpt":"2-3 sentence summary","body":"Markdown body without H1"}`;

  const sourceList = research.sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n");

  const userMessage = `# Topic
${item.title}

Writing angle: ${item.angle}

# Research Facts
${research.facts}

# Sources
${sourceList}`;

  const result = await callLLM(system, userMessage, 8192, 120000);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Parse response
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title && parsed.body) {
      console.log(`  Title: ${parsed.title}`);
      console.log(`  Body: ${parsed.body.length} chars`);
      return parsed;
    }
  } catch {
    const extractField = (name: string): string | null => {
      const re = new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
      const m = cleaned.match(re);
      if (!m) return null;
      return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    };
    const title = extractField("title");
    const body = extractField("body");
    if (title && body) {
      return { title, tag: extractField("tag") || "解説", excerpt: extractField("excerpt") || "", body };
    }
  }

  throw new Error("Failed to parse article output");
}

// ── Step 5: Fact-check (NEW) ──

async function validateArticle(
  article: ArticleDraft,
  research: { facts: string; sources: ResearchSource[] }
): Promise<ValidationResult> {
  console.log(`\n═══ Fact-Checking ═══\n`);

  const system = `You are a fact-checker. Verify the blog article against the research sources.

Check:
1. Numbers/data match sources
2. Product names, company names, person names are correct
3. Dates are accurate
4. Quotes/claims accurately reflect source content
5. Overall logical consistency

For each issue, specify what's wrong and the correct info.

Respond as JSON:
{"valid":true/false,"issues":["issue 1: description","issue 2: ..."],"suggestions":["fix 1","fix 2"]}`;

  const userMessage = `# Article to verify
Title: ${article.title}

${article.body}

# Research facts (source of truth)
${research.facts}`;

  const result = await callLLM(system, userMessage, 2048);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    console.log(`  Valid: ${parsed.valid}`);
    if (parsed.issues?.length > 0) {
      parsed.issues.forEach((i: string) => console.log(`    ✗ ${i}`));
    }
    if (parsed.suggestions?.length > 0) {
      parsed.suggestions.forEach((s: string) => console.log(`    → ${s}`));
    }
    return parsed;
  } catch {
    return { valid: true, issues: [], suggestions: [] };
  }
}

// ── Step 6: Revise (NEW) ──

async function reviseArticle(
  article: ArticleDraft,
  validation: ValidationResult
): Promise<ArticleDraft> {
  console.log(`\n═══ Revising ═══\n`);

  const system = `Fix the fact-check issues in this blog article.
Only fix the specific issues mentioned. Keep the structure and tone.
Respond as JSON: {"title":"...","tag":"...","excerpt":"...","body":"corrected Markdown"}`;

  const userMessage = `# Article
${JSON.stringify(article, null, 2)}

# Issues
${validation.issues.join("\n")}

# Suggestions
${validation.suggestions.join("\n")}`;

  const result = await callLLM(system, userMessage, 8192);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title && parsed.body) {
      console.log("  Article revised");
      return parsed;
    }
  } catch { /* keep original */ }

  return article;
}

// ── Step 7: Save ──

function saveArticle(article: ArticleDraft, sourceUrl: string): string {
  const slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const frontmatter = [
    "---",
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `date: "${new Date().toISOString().split("T")[0]}"`,
    `tag: "${article.tag}"`,
    `excerpt: "${(article.excerpt || "").replace(/"/g, '\\"')}"`,
    `source: "${sourceUrl}"`,
    "---",
  ].join("\n");

  const content = `${frontmatter}\n\n${article.body}`;

  const blogDir = path.join(process.cwd(), "src/content/blog");
  fs.mkdirSync(blogDir, { recursive: true });
  const filePath = path.join(blogDir, `${slug}.md`);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  Saved: src/content/blog/${slug}.md`);

  return filePath;
}

// ── Dedup ──

function loadPublishedUrls(): Set<string> {
  const seen = new Set<string>();
  const blogDir = path.join(process.cwd(), "src/content/blog");
  try {
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
      const m = content.match(/source:\s*"?([^"\n]+)"?/);
      if (m) seen.add(m[1].trim());
    }
  } catch { /* ignore */ }
  return seen;
}

// ── Main pipeline ──

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  AI Blog Generation Pipeline");
  console.log("═══════════════════════════════════════\n");

  const startTime = Date.now();
  let scored: ScoredNews[];

  if (GIVEN_TOPIC) {
    // Skip discovery, use given topic
    scored = [{
      title: GIVEN_TOPIC,
      url: "",
      source: "manual",
      snippet: GIVEN_TOPIC,
      date: new Date().toISOString(),
      scores: { technical_depth: 8, reader_value: 8, timeliness: 8, opinion_potential: 8 },
      total: 32,
      angle: "与えられたトピックの詳細分析",
    }];
  } else {
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
    scored = await scoreAndFilter(newNews);
    if (scored.length === 0) {
      console.log("  No items met quality threshold. Exiting.");
      return;
    }
  }

  if (DRY_RUN) {
    console.log("\n  Dry run — stopping after scoring.");
    return;
  }

  // Process each scored item
  for (const item of scored) {
    console.log(`\n━━━ Processing: ${item.title.slice(0, 70)} ━━━`);

    try {
      // Step 4: Research
      const research = await researchTopic(item);

      // Step 5: Write
      let article = await writeArticle(item, research);

      // Step 6: Fact-check
      const validation = await validateArticle(article, research);

      // Step 7: Revise if needed (max 2 attempts)
      if (!validation.valid && validation.issues.length > 0) {
        console.log("\n  Validation failed, revising...");
        article = await reviseArticle(article, validation);

        // Re-validate
        const reCheck = await validateArticle(article, research);
        if (!reCheck.valid) {
          console.warn("  ⚠ Still has issues after revision — manual review recommended");
        }
      }

      // Step 8: Save
      const filePath = saveArticle(article, item.url);

      // Step 9: Publish (optional)
      if (AUTO_PUBLISH) {
        console.log("\n═══ Publishing ═══\n");
        const { execSync } = await import("child_process");
        try {
          execSync(`echo "y" | ./scripts/publish-blog.sh "${filePath}"`, {
            stdio: "inherit",
            cwd: process.cwd(),
          });
        } catch (err) {
          console.error(`  Publish failed: ${err}`);
          console.log(`  Manual: ./scripts/publish-blog.sh "${filePath}"`);
        }
      } else {
        console.log(`\n  To publish: ./scripts/publish-blog.sh "${filePath}"`);
      }

      console.log(`  ✓ Done: ${article.title}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n═══ Pipeline complete in ${elapsed}s ═══`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
