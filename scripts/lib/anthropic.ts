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

const LLM_TIMEOUT_MS = 180000; // 180 seconds timeout per LLM call (long articles need more time)

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
  timeoutMs = LLM_TIMEOUT_MS
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "LLM_API_KEY (or ANTHROPIC_API_KEY) env var not set.\n" +
        "Set LLM_PROVIDER=ollama and LLM_API_KEY=your-ollama-key for Ollama Cloud."
    );
  }

  if (PROVIDER === "anthropic") {
    return callAnthropic(systemPrompt, userMessage, maxTokens, timeoutMs);
  }
  // ollama and openai both use OpenAI-compatible format
  return callOpenAICompatible(systemPrompt, userMessage, maxTokens, timeoutMs);
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
  maxTokens: number,
  timeoutMs: number = LLM_TIMEOUT_MS
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
  }, timeoutMs);

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
  maxTokens: number,
  timeoutMs: number = LLM_TIMEOUT_MS
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
  }, timeoutMs);

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
 * Generate an opinionated Japanese blog post from news sources.
 * Includes personal analysis, Japanese developer perspective, and a 「考察」 section.
 */
export async function generateOpinionatedBlogPost(
  title: string,
  snippet: string,
  source: string,
  url: string,
  date: string,
  angle: string,
  scores: { technical_depth: number; reader_value: number; timeliness: number; opinion_potential: number }
): Promise<{ title: string; content: string; excerpt: string; tag: string }> {
  const system = `あなたは日本のAI専門ジャーナリストです。AI Models Navi（aimodelsnavi.com）のライターとして、AIニュースを日本語で解説する記事を執筆します。

# 文体ルール
- 「〜だ」「〜である」調（ですます調は使わない）
- 客観的事実と執筆者の意見・分析を明確に区別する
- 数字や性能値は捏造しない。不明な点は「不明」「未発表」と明記
- 記事末尾に「## 考察」セクションを必ず入れる
- 日本のAI開発者にとっての意義や影響を含める
- 日本語として自然で、翻訳調にならないように

# タイトル
- SEOを意識した日本語タイトル
- 具体的な内容が伝わるもの（クリックベイトは避ける）

# タグ（以下のいずれか）
OpenAI, Anthropic, Google, オープンソース, ベンチマーク, AIエージェント, xAI, DeepSeek, 解説, 速報

# 執筆の切り口
${angle}

# 出力形式（JSON）
{
  "title": "日本語タイトル",
  "content": "マークダウン本文（H1見出しは含めない）",
  "excerpt": "2-3文の日本語サマリー",
  "tag": "タグ"
}`;

  const userMessage = `# ニュース情報
タイトル: ${title}
ソース: ${source}
URL: ${url}
日付: ${date}
技術的深さ: ${scores.technical_depth}/10
読者価値: ${scores.reader_value}/10
速報性: ${scores.timeliness}/10
意見性: ${scores.opinion_potential}/10

# 元コンテンツ
${snippet.slice(0, 8000)}`;

  const result = await callLLM(system, userMessage, 8192);
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
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
  images?: { alt: string; localPath: string }[]
): Promise<{ title: string; content: string; excerpt: string; tag: string }> {
  let imageInstructions = "";
  if (images && images.length > 0) {
    const imageList = images.map((img, i) =>
      `  ${i + 1}. ![](${img.localPath}) — alt: "${img.alt}"`
    ).join("\n");
    imageInstructions = `
# Available images
The following images are available for use in the article. Insert them at appropriate positions using the exact markdown syntax shown:
${imageList}
`;
  }

  const system = `You are a Japanese tech journalist specializing in AI/ML. You are translating and adapting a Chinese AI blog article for Japanese readers.

Process:
1. Translate the article from Chinese to natural, fluent Japanese
2. Preserve the structure (sections, key points) but adapt expressions for Japanese readers
3. Keep all technical terms accurate — use standard Japanese AI/ML terminology
4. DO NOT add any attribution note, source link, or "translated from" disclaimer at the end. Write as if the article is original content for AI Models Navi.
5. Title should be SEO-friendly Japanese (not literal translation — make it natural for Japanese readers)
6. Provide an excerpt (2-3 Japanese sentences summarizing the key point)
7. Choose ONE most appropriate tag: OpenAI, Anthropic, Google, オープンソース, 料金比較, ベンチマーク, チュートリアル, AIエージェント
${imageInstructions}
Respond as JSON:
{
  "title": "Japanese title",
  "content": "Japanese article body in markdown (NO H1 heading — title rendered separately)",
  "excerpt": "2-3 sentence Japanese summary",
  "tag": "tag name"
}`;

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
 * Translate a user-written Chinese Markdown blog post into Japanese.
 * Unlike processBlogArticle() (which handles crawled HTML), this preserves
 * the author's Markdown structure faithfully during translation.
 */
export async function translateBlogMarkdown(
  titleZh: string,
  bodyMarkdown: string,
  excerptZh?: string
): Promise<{ title: string; content: string; excerpt: string; tag: string }> {
  const system = `あなたは日本語のAI技術ライターです。中国語で書かれたブログ記事を、日本のAI開発者向けに翻訳・再構成します。

# 翻訳ルール
- 中国語原文のMarkdown構造を忠実に保持する（見出しレベル、コードブロック、リスト、リンク、テーブル、画像参照）
- 日本語として自然な表現にする（翻訳調を避ける）
- 技術用語は標準的な日本語AI/ML用語を使用する：
  - "benchmark" → 「ベンチマーク」
  - "reasoning" → 「推論」
  - "context window" → 「コンテキストウィンドウ」
  - "open-source" → 「オープンソース」
  - "fine-tuning" → 「ファインチューニング」
  - "token" → 「トークン」
  - "latency" → 「レイテンシ」
  - "throughput" → 「スループット」
  - "multimodal" → 「マルチモーダル」
  - "inference" → 「推論」
  - "training" → 「学習」
  - "parameter" → 「パラメータ」
- 英語のモデル名、API名、URL、コードはそのまま維持する
- 画像参照（![alt](url)）はそのまま保持する。URLは一切変更しない。altテキストのみ日本語に翻訳する
- 画像の追加・削除はしない。原文にある画像は全て保持する
- 「翻訳元」「原文はこちら」等の注釈は一切付けない
- WeChat/微信公众号へのリンク（mp.weixin.qq.com）は削除する
- 動画のみの引用（「動画ソース」「视频来源」等）は削除する
- 動画生成のためのプロンプト（コードブロック内の指示文）は削除する
- 「参考」「出典」「Source」セクションは削除する
- 記事本文にはH1見出しを含めない（タイトルは別にレンダリングされる）
- 「です・ます」調ではなく「だ・である」調で書く

# タグ選択ルール
記事の主要内容に基づいてタグを選択する：
- OpenAI製品・モデルに関する記事 → "OpenAI"
- Anthropic製品・モデルに関する記事 → "Anthropic"
- Google製品・モデルに関する記事 → "Google"
- DeepSeek製品・モデルに関する記事 → "DeepSeek"
- xAI/Grokに関する記事 → "xAI"
- オープンソースモデル・プロジェクト → "オープンソース"
- ベンチマーク・性能比較 → "ベンチマーク"
- 上記のどれでもない場合 → "解説" または "速報"

# 出力形式（JSON）
重要：以下のJSONは文字列として出力してはいけない。必ずJSONオブジェクトとして出力すること。
{
  "title": "SEOを意識した日本語タイトル（中国語は一切使わない）",
  "content": "Markdown本文（H1見出しは含めない。全て日本語で書く）",
  "excerpt": "2-3文の日本語要約（中国語は一切使わない）",
  "tag": "上記ルールに基づいて選択した1つのタグ"
}`;

  const maxBodyLen = 12000;
  const truncatedBody = bodyMarkdown.length > maxBodyLen
    ? bodyMarkdown.slice(0, maxBodyLen) + "\n\n[文章が長いため省略しました]"
    : bodyMarkdown;

  const userMessage = `Original title (Chinese): ${titleZh}
${excerptZh ? `Excerpt (Chinese): ${excerptZh}` : ""}

Article body (Chinese Markdown):
${truncatedBody}`;

  const result = await callLLM(system, userMessage, 8192, 120000); // 120s for blog translation
  const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Attempt 1: direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.title && parsed.content) return parsed;
  } catch { /* not valid JSON */ }

  // Attempt 2: extract JSON object from response and parse
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.content) return parsed;
    }
  } catch { /* not valid JSON */ }

  // Attempt 3: LLM returned JSON as escaped string — extract fields via regex
  // Handles: {"title":"...", "content":"line1\nline2", "excerpt":"...", "tag":"..."}
  const extractField = (name: string): string | null => {
    // Match "name":"value" where value may contain escaped chars
    const re = new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
    const m = cleaned.match(re);
    if (!m) return null;
    // Unescape JSON string escapes
    return m[1]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  };

  const title = extractField("title");
  const content = extractField("content");
  const excerpt = extractField("excerpt");
  const tag = extractField("tag");

  if (title && content) {
    console.warn("  ⚠ Extracted fields via regex (JSON parse failed)");
    return {
      title,
      content,
      excerpt: excerpt || excerptZh || "",
      tag: tag || "解説",
    };
  }

  // Fallback: LLM returned raw content, not JSON
  console.warn("  ⚠ JSON parse failed, using raw content as fallback");
  return {
    title: titleZh,
    content: cleaned,
    excerpt: excerptZh || "",
    tag: "解説",
  };
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

/**
 * Find related blog articles using LLM semantic understanding.
 * Given a current post and a manifest of all posts, returns the most related slugs.
 */
export async function findRelatedArticles(
  currentPost: { slug: string; title: string; tag: string; excerpt: string; topics: string[] },
  manifest: { slug: string; title: string; tag: string; excerpt: string; topics: string[] }[],
  maxResults = 3
): Promise<{ slug: string; reason: string }[]> {
  // Filter out the current post itself
  const candidates = manifest.filter((p) => p.slug !== currentPost.slug);

  // Build a compact manifest for the LLM (title + tag + topics only, to save tokens)
  const manifestText = candidates
    .map((p) => `[${p.slug}] tag:${p.tag} topics:${p.topics.join(",")} — ${p.title}`)
    .join("\n");

  const system = `あなたはブログの内部リンク専門家です。与えられた記事と、既存記事のマニフェストを比較し、最も関連性の高い記事を${maxResults}つ選んでください。

選定基準（優先順位順）：
1. 同じトピック・同じ企業・同じモデルについての記事
2. 互いに補完する記事（例：モデル発表 → ベンチマーク評価 → 料金比較）
3. 読者が続けて読みたくなる記事

出力形式（JSON配列）：
[
  {"slug": "記事のスラッグ", "reason": "関連する理由（日本語、1文）"}
]

スラッグはマニフェストに記載されたものを正確にコピーしてください。`;

  const userMessage = `# 現在の記事
タイトル: ${currentPost.title}
タグ: ${currentPost.tag}
トピック: ${currentPost.topics.join(", ")}
要約: ${currentPost.excerpt}

# 既存記事マニフェスト
${manifestText}`;

  try {
    const result = await callLLM(system, userMessage, 1024, 30000);
    const cleaned = result.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      // Validate slugs exist in manifest
      const validSlugs = new Set(candidates.map((p) => p.slug));
      return parsed
        .filter((r: any) => r.slug && validSlugs.has(r.slug))
        .slice(0, maxResults);
    }
  } catch (err) {
    console.warn(`  ⚠ LLM related-article search failed: ${err}`);
  }

  // Fallback: find by topic overlap
  const currentTopics = new Set(currentPost.topics);
  const scored = candidates
    .map((p) => {
      const overlap = p.topics.filter((t) => currentTopics.has(t)).length;
      return { slug: p.slug, score: overlap, reason: `共通トピック: ${p.topics.filter((t) => currentTopics.has(t)).join(", ")}` };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map((s) => ({ slug: s.slug, reason: s.reason }));
}