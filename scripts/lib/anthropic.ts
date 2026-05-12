/**
 * LLM API wrapper for data extraction and Japanese translation.
 *
 * Supports multiple providers via environment variables:
 *   LLM_PROVIDER=ollama   → Ollama Cloud (OpenAI-compatible at https://ollama.com/v1)
 *   LLM_PROVIDER=anthropic → Anthropic Claude API (default for backward compat)
 *   LLM_PROVIDER=openai    → OpenAI API
 *
 * Required env vars:
 *   LLM_API_KEY   — API key for the chosen provider
 *   LLM_MODEL      — Model name (defaults vary by provider)
 *
 * Optional env vars:
 *   LLM_BASE_URL   — Override base URL (e.g. for self-hosted Ollama)
 *   LLM_PROVIDER   — "ollama" | "anthropic" | "openai" (default: "ollama")
 */

// ── Configuration ──

type Provider = "ollama" | "anthropic" | "openai";

const PROVIDER = (process.env.LLM_PROVIDER || "ollama") as Provider;
const API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";

const DEFAULT_MODELS: Record<Provider, string> = {
  ollama: "gemma4:31b",
  anthropic: "claude-sonnet-4-6-20250514",
  openai: "gpt-4.1",
};

const MODEL = process.env.LLM_MODEL || DEFAULT_MODELS[PROVIDER];

const BASE_URLS: Record<Provider, string> = {
  ollama: "https://ollama.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
};

const BASE_URL = process.env.LLM_BASE_URL || BASE_URLS[PROVIDER];

// ── API call ──

const LLM_TIMEOUT_MS = 45000; // 45 seconds timeout per LLM call

async function callLLM(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "LLM_API_KEY (or ANTHROPIC_API_KEY) env var not set.\n" +
        "Set LLM_PROVIDER=ollama and LLM_API_KEY=your-ollama-key for Ollama Cloud."
    );
  }

  if (PROVIDER === "anthropic") {
    return callAnthropic(systemPrompt, userMessage, maxTokens);
  }
  // ollama and openai both use OpenAI-compatible format
  return callOpenAICompatible(systemPrompt, userMessage, maxTokens);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const res = await fetchWithTimeout(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  }, LLM_TIMEOUT_MS);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAICompatible(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const res = await fetchWithTimeout(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  }, LLM_TIMEOUT_MS);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Public functions (unchanged interface) ──

/**
 * Extract structured data from raw HTML using LLM's semantic understanding.
 * Much more robust than CSS selectors — survives DOM structure changes.
 */
export async function extractFromHTML<T>(
  html: string,
  schema: string,
  instructions: string
): Promise<T> {
  const system = `You are a data extraction tool. Extract structured data from HTML following the exact schema provided.
Respond ONLY with valid JSON. No explanations, no markdown fences.

${instructions}`;

  const result = await callLLM(system, html, 4096);

  const cleaned = result
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Translate technical content to Japanese, preserving terminology consistency.
 */
export async function translateToJapanese(
  content: string,
  context = "AI model technical documentation"
): Promise<string> {
  const system = `You are a professional Japanese technical translator specializing in AI/ML content.

Terminology rules:
- "benchmark" → 「ベンチマーク」
- "reasoning model" → 「推論モデル」
- "context window" → 「コンテキストウィンドウ」
- "open-source" → 「オープンソース」
- "API pricing" → 「API料金」
- "multimodal" → 「マルチモーダル」
- "fine-tuning" → 「ファインチューニング」
- "latency" → 「レイテンシ」
- "throughput" → 「スループット」
- "token" → 「トークン」

Style: Professional yet accessible. Target audience is Japanese developers and technical decision-makers.
Preserve all numbers, URLs, and technical identifiers exactly as-is.
Context: ${context}`;

  return callLLM(system, content, 4096);
}

/**
 * Generate a Japanese blog post from source materials.
 */
export async function generateBlogPost(
  topic: string,
  sources: string[]
): Promise<{ title: string; content: string; excerpt: string; tag: string }> {
  const system = `You are a Japanese tech journalist specializing in AI. Write a blog post based on the provided source materials.

Requirements:
- Natural, engaging Japanese
- Technical accuracy is paramount — do NOT fabricate numbers or claims
- Include specific benchmark scores when source materials provide them
- Title should be SEO-friendly (include key model names / technical terms)
- Provide an excerpt (2-3 sentences)
- Choose one tag: OpenAI, Anthropic, Google, オープンソース, 料金比較, ベンチマーク, チュートリアル
- The "content" field should be the article BODY only, starting directly with text or an H2 heading. Do NOT include an H1 heading — the title is rendered separately.

Respond as JSON:
{
  "title": "...",
  "content": "... (markdown body, no H1 heading)",
  "excerpt": "...",
  "tag": "..."
}`;

  const sourcesBlock = sources
    .map((s, i) => `### Source ${i + 1}:\n${s}`)
    .join("\n\n");

  const result = await callLLM(
    system,
    `Topic: ${topic}\n\n${sourcesBlock}`,
    8192
  );

  const cleaned = result
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Process a Chinese blog article into a Japanese blog post.
 * Translates and adapts for Japanese AI developer audience.
 */
export async function processBlogArticle(
  titleZh: string,
  bodyText: string,
  sourceUrl: string,
  date: string,
  tags: string[]
): Promise<{ title: string; content: string; excerpt: string; tag: string }> {
  const system = `You are a Japanese tech journalist specializing in AI/ML. You are translating and adapting a Chinese AI blog article for Japanese readers.

Process:
1. Translate the article from Chinese to natural, fluent Japanese
2. Preserve the structure (sections, key points) but adapt expressions for Japanese readers
3. Keep all technical terms accurate — use standard Japanese AI/ML terminology
4. Add a brief note at the end: 「本記事はDataLearnerAIの記事を翻訳・編集したものです。元記事: ${sourceUrl}」
5. Title should be SEO-friendly Japanese (not literal translation — make it natural for Japanese readers)
6. Provide an excerpt (2-3 Japanese sentences summarizing the key point)
7. Choose ONE most appropriate tag: OpenAI, Anthropic, Google, オープンソース, 料金比較, ベンチマーク, チュートリアル, AIエージェント

Respond as JSON:
{
  "title": "Japanese title",
  "content": "Japanese article body in markdown (NO H1 heading — title rendered separately)",
  "excerpt": "2-3 sentence Japanese summary",
  "tag": "tag name"
}

Original tags for context: ${tags.join(", ")}
Original date: ${date}`;

  // Truncate body to fit context window (reserve ~2K for system prompt, ~4K for output)
  const maxBodyLen = 12000;
  const truncatedBody = bodyText.length > maxBodyLen
    ? bodyText.slice(0, maxBodyLen) + "\n\n[文章は長いため省略されました]"
    : bodyText;

  const result = await callLLM(
    system,
    `Original title: ${titleZh}\n\nArticle content:\n${truncatedBody}`,
    8192
  );

  const cleaned = result
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Simple validation check — does the extracted data look reasonable?
 */
export async function validateData<T>(
  data: T,
  context: string
): Promise<{ valid: boolean; issues: string[] }> {
  const system = `Validate the following data for obvious errors or anomalies in context: ${context}.
Check for: unrealistic prices, missing required fields, contradictory information, impossible values.
Respond as JSON: { "valid": true/false, "issues": ["..."] }`;

  const result = await callLLM(system, JSON.stringify(data, null, 2), 1024);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}