/**
 * Claude API wrapper for data extraction and Japanese translation.
 *
 * Used by all sync scripts for:
 *   - Extracting structured data from unstructured HTML
 *   - Translating technical content to Japanese
 *   - Generating blog posts
 *   - Validating extracted data
 *
 * Set ANTHROPIC_API_KEY env var to authenticate.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeResponse {
  content: Array<{ type: "text"; text: string }>;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model = "claude-sonnet-4-6-20250514",
  maxTokens = 4096
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY env var not set");
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data: ClaudeResponse = await res.json();
  return data.content[0].text;
}

/**
 * Extract structured data from raw HTML using Claude's semantic understanding.
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

  const result = await callClaude(system, html, "claude-sonnet-4-6-20250514", 4096);

  // Clean possible markdown code fences
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

  return callClaude(system, content, "claude-sonnet-4-6-20250514", 4096);
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

  const result = await callClaude(
    system,
    `Topic: ${topic}\n\n${sourcesBlock}`,
    "claude-sonnet-4-6-20250514",
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

  const result = await callClaude(system, JSON.stringify(data, null, 2), "claude-haiku-4-6-20250514", 1024);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}
