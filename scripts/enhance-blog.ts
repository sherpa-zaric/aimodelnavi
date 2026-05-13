#!/usr/bin/env tsx

/**
 * enhance-blog.ts
 *
 * Finds short blog posts and uses AI to expand them with more depth,
 * analysis, and better structure. Supports multi-pass enhancement
 * with different Ollama models.
 *
 * Usage:
 *   npx tsx scripts/enhance-blog.ts              # enhance all short posts
 *   npx tsx scripts/enhance-blog.ts --dry-run    # preview which posts would be enhanced
 *   npx tsx scripts/enhance-blog.ts --slug=xxx   # enhance a specific post
 */

import fs from "fs";
import path from "path";
import { getAllPosts, BlogPost } from "../lib/blog";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");
const MIN_CONTENT_LENGTH = 1500; // chars below this need enhancement

// ── LLM helpers ──

async function callOllama(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const key = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const baseUrl = process.env.LLM_BASE_URL || "https://ollama.com/v1/chat/completions";

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Content enrichment (Pass 1) ──

async function enrichContent(
  title: string,
  content: string,
  excerpt: string,
  tag: string,
  sourceUrl?: string
): Promise<string> {
  const model = process.env.ENRICH_MODEL || "deepseek-v3.2:cloud";

  console.log(`    Pass 1: Content enrichment (${model})...`);

  const system = `あなたは日本のAI専門ジャーナリストです。以下のブログ記事を元に、内容を拡充してください。

# 拡充のポイント
- 技術的な背景や文脈を追加する（この技術がなぜ重要なのか）
- 具体的な数字やデータがあれば、その意味を解説する
- 日本のAI開発者にとっての実用的な示唆を加える
- 業界のトレンドや関連する他の動きとの関連性を示す
- 元の記事の事実を変えずに、肉付けする

# 文体
- 「〜だ」「〜である」調
- マークダウン形式（見出しはH2から）
- 記事タイトル（H1）は含めない
- 最後に「## まとめ」セクションを入れる

# 出力
拡充された記事全文をマークダウンで出力してください。JSONではなく、直接マークダウンのみ。`;

  const srcInfo = sourceUrl ? `\n\n元記事URL: ${sourceUrl}` : "";
  const userMessage = `# タイトル: ${title}\n# タグ: ${tag}\n# 要約: ${excerpt}\n\n# 元の記事:\n${content}${srcInfo}`;

  return callOllama(model, system, userMessage, 8192);
}

// ── Style polish (Pass 2) ──

async function polishStyle(content: string, title: string): Promise<string> {
  const model = process.env.POLISH_MODEL || "gemma4:31b";

  console.log(`    Pass 2: Style polish (${model})...`);

  const system = `あなたは日本語のプロの編集者です。以下のブログ記事の文体を改善してください。

# 改善ポイント
- より自然な日本語表現にする（翻訳調を排除）
- 冗長な表現を削り、簡潔にする
- 段落の長さを適切に調整（長すぎる段落は分割）
- 読みやすさを向上させる
- 技術用語は正確に保つ
- マークダウン形式を維持する

# 出力
改善された記事全文をマークダウンで出力してください。JSONではなく直接マークダウンのみ。`;

  const userMessage = `# タイトル: ${title}\n\n# 元の記事:\n${content}`;

  return callOllama(model, system, userMessage, 4096);
}

// ── Main ──

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const slugFilter = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

  console.log("═══════════════════════════════════════");
  console.log("  ブログ記事 AI 拡充");
  console.log("═══════════════════════════════════════\n");

  const allPosts = getAllPosts();
  const candidates = slugFilter
    ? allPosts.filter((p) => p.slug === slugFilter)
    : allPosts.filter((p) => p.content.length < MIN_CONTENT_LENGTH);

  if (candidates.length === 0) {
    console.log("  拡充が必要な短い記事はありません。");
    return;
  }

  console.log(`  対象: ${candidates.length} 記事 (全 ${allPosts.length} 中)\n`);

  for (let i = 0; i < candidates.length; i++) {
    const post = candidates[i];
    const contentLen = post.content.length;
    console.log(`[${i + 1}/${candidates.length}] ${post.title.slice(0, 70)}`);
    console.log(`    ${contentLen} chars → `);

    if (dryRun) {
      console.log("    (dry-run: スキップ)");
      continue;
    }

    try {
      // Extract source URL from frontmatter if present
      const filePath = path.join(BLOG_DIR, `${post.slug}.md`);
      const rawMd = fs.readFileSync(filePath, "utf-8");
      const sourceMatch = rawMd.match(/source:\s*"?([^"\n]+)"?/);
      const sourceUrl = sourceMatch?.[1];

      // Pass 1: Content enrichment
      const enriched = await enrichContent(
        post.title,
        post.content,
        post.excerpt,
        post.tag,
        sourceUrl
      );

      // Pass 2: Style polish
      const polished = await polishStyle(enriched, post.title);

      // Update the markdown file
      const newContent = rawMd.replace(
        /---[\s\S]*?---/,
        (frontmatter) => {
          // Keep existing frontmatter, update excerpt if needed
          return frontmatter;
        }
      );

      // Replace the content portion (everything after frontmatter)
      const frontmatterEnd = rawMd.indexOf("---", 4) + 3;
      const updatedMd = rawMd.slice(0, frontmatterEnd) + "\n\n" + polished.trim() + "\n";

      fs.writeFileSync(filePath, updatedMd, "utf-8");

      const newLen = polished.length;
      const growth = Math.round(((newLen - contentLen) / contentLen) * 100);
      console.log(`    ${newLen} chars (${growth > 0 ? "+" : ""}${growth}%) ✓`);
    } catch (err) {
      console.error(`    ✗ Failed: ${err}`);
    }
  }

  console.log(`\n  完了! dry-run=${dryRun}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
