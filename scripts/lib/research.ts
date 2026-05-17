/**
 * research.ts — Web research helpers for blog generation
 *
 * Provides functions to fetch web pages, extract readable text,
 * and prepare content for LLM analysis.
 */

import { rateLimitedFetch } from "./http";

// ── HTML to plain text extraction ──

export function htmlToText(html: string): string {
  let text = html;

  // Remove script, style, nav, footer, header tags and their content
  text = text.replace(/<(script|style|nav|footer|header|noscript)[^>]*>[\s\S]*?<\/\1>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Collapse multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text;
}

// ── Extract title from HTML ──

export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

// ── Extract meta description ──

export function extractMetaDescription(html: string): string {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  return match ? match[1].trim() : "";
}

// ── Fetch a URL and return extracted text ──

export interface ResearchSource {
  url: string;
  title: string;
  text: string;
  fetchedAt: string;
}

export async function fetchAndExtract(url: string, maxChars = 8000): Promise<ResearchSource | null> {
  try {
    const res = await rateLimitedFetch(url, { timeoutMs: 15000 });
    if (res.status !== 200) {
      console.warn(`  HTTP ${res.status} for ${url}`);
      return null;
    }

    const title = extractTitle(res.body);
    const text = htmlToText(res.body).slice(0, maxChars);

    if (text.length < 100) {
      console.warn(`  Too little content from ${url} (${text.length} chars)`);
      return null;
    }

    return {
      url,
      title,
      text,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`  Failed to fetch ${url}: ${err}`);
    return null;
  }
}

// ── Fetch multiple URLs in parallel (with rate limiting) ──

export async function fetchSources(urls: string[], maxChars = 8000): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];

  for (const url of urls) {
    const source = await fetchAndExtract(url, maxChars);
    if (source) {
      results.push(source);
      console.log(`  ✓ ${source.title || url} (${source.text.length} chars)`);
    }
  }

  return results;
}

// ── Build a research summary for LLM consumption ──

export function formatResearchForLLM(sources: ResearchSource[]): string {
  return sources
    .map((s, i) => `## Source ${i + 1}: ${s.title}\nURL: ${s.url}\n\n${s.text}`)
    .join("\n\n---\n\n");
}
