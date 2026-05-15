#!/usr/bin/env tsx

/**
 * add-internal-links.ts — Add internal links (関連記事) to blog posts
 *
 * Reads all blog posts, adds a "関連記事" section at the end of each post
 * with links to related articles based on topic clusters.
 *
 * Usage:
 *   npx tsx scripts/add-internal-links.ts          # dry run (preview only)
 *   npx tsx scripts/add-internal-links.ts --apply   # actually write changes
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const APPLY = process.argv.includes("--apply");

// ── Related article mapping ──
// Key: slug, Value: array of related slugs (max 3-4 per article)

const RELATED: Record<string, string[]> = {
  // === Anthropic / Claude cluster ===
  "claude-opus-4-7-overview": [
    "claude-mythos-preview-capabilities-openbsd-zero-day",
    "anthropic-claude-opus-4-7-software-engineering",
    "openai-gpt-5-2-benchmark-review",
  ],
  "anthropic-claude-opus-4-7-software-engineering": [
    "claude-opus-4-7-overview",
    "openai-gpt-5-2-benchmark-review",
    "claude-mythos-preview-capabilities-openbsd-zero-day",
  ],
  "claude-mythos-preview-capabilities-openbsd-zero-day": [
    "claude-mythos-preview-system-card-findings",
    "openai-daybreak-ai-anthropic",
    "claude-opus-4-7-overview",
  ],
  "claude-mythos-preview-system-card-findings": [
    "claude-mythos-preview-capabilities-openbsd-zero-day",
    "openai-daybreak-ai-anthropic",
    "anthropic-information-leak-strongest-model",
  ],
  "anthropic-information-leak-strongest-model": [
    "claude-mythos-preview-capabilities-openbsd-zero-day",
    "claude-mythos-preview-system-card-findings",
    "claude-opus-4-7-overview",
  ],
  "anthropic-engineer-html-is-the-new-markdown-analysis": [
    "claude-opus-4-7-overview",
    "sparser-faster-lighter-transformer-language-models",
  ],

  // === OpenAI / GPT cluster ===
  "openai-gpt-5-5-spud-release": [
    "gpt-5-2-benchmark-review",
    "openai-goblin-event-rlhf-reward-bias",
    "openai-frontier-agent-platform-enterprise",
  ],
  "openai-frontier-agent-platform-enterprise": [
    "openai-gpt-5-5-spud-release",
    "claude-opus-4-7-overview",
    "metagpt-rebrands-atoms-ai-business-building",
  ],
  "openai-daybreak-ai-anthropic": [
    "claude-mythos-preview-capabilities-openbsd-zero-day",
    "openai-gpt-5-5-spud-release",
    "claude-mythos-preview-system-card-findings",
  ],
  "openai-goblin-event-rlhf-reward-bias": [
    "openai-gpt-5-5-spud-release",
    "gpt-5-2-benchmark-review",
  ],
  "gpt-5-2-benchmark-review": [
    "openai-gpt-5-5-spud-release",
    "api-pricing-may-2026",
    "claude-opus-4-7-overview",
  ],

  // === Qwen / Alibaba cluster ===
  "qwen3-6-27b-code-agent-benchmarks": [
    "qwen3-6-35b-a3b-open-source-agent",
    "qwen3-coder-next-80b-a3b-open-source",
    "qwen-image-2-0-text-image-editing",
  ],
  "qwen3-6-35b-a3b-open-source-agent": [
    "qwen3-6-27b-code-agent-benchmarks",
    "qwen3-coder-next-80b-a3b-open-source",
    "qwen3-tts-open-source-speech-synthesis",
  ],
  "qwen3-coder-next-80b-a3b-open-source": [
    "qwen3-6-27b-code-agent-benchmarks",
    "qwen3-6-35b-a3b-open-source-agent",
    "openai-frontier-agent-platform-enterprise",
  ],
  "qwen3-tts-open-source-speech-synthesis": [
    "qwen3-6-35b-a3b-open-source-agent",
    "qwen3-6-27b-code-agent-benchmarks",
  ],
  "qwen-image-2-0-text-image-editing": [
    "qwen3-6-27b-code-agent-benchmarks",
    "qwen3-6-35b-a3b-open-source-agent",
  ],

  // === Benchmark cluster ===
  "arc-agi-3-benchmark-launch-2026": [
    "clawbench-agent-evaluation-enterprise-tasks",
    "osworld-verified-agent-benchmark-os",
    "gpt-5-2-benchmark-review",
  ],
  "clawbench-agent-evaluation-enterprise-tasks": [
    "osworld-verified-agent-benchmark-os",
    "arc-agi-3-benchmark-launch-2026",
    "openai-frontier-agent-platform-enterprise",
  ],
  "osworld-verified-agent-benchmark-os": [
    "clawbench-agent-evaluation-enterprise-tasks",
    "aa-lcr-knowledge-worker-document-benchmark",
    "arc-agi-3-benchmark-launch-2026",
  ],
  "aa-lcr-knowledge-worker-document-benchmark": [
    "arc-agi-3-benchmark-launch-2026",
    "osworld-verified-agent-benchmark-os",
  ],
  "sparser-faster-lighter-transformer-language-models": [
    "qwen3-6-27b-code-agent-benchmarks",
    "stepfun-step-3-5-flash-sparse-moe",
  ],

  // === AI Agent cluster ===
  "metagpt-rebrands-atoms-ai-business-building": [
    "openai-frontier-agent-platform-enterprise",
    "moltbook-social-network-for-ai-agents",
    "moonshot-kimi-claw-cloud-ai-assistant",
  ],
  "moltbook-social-network-for-ai-agents": [
    "metagpt-rebrands-atoms-ai-business-building",
    "openai-frontier-agent-platform-enterprise",
  ],
  "moonshot-kimi-claw-cloud-ai-assistant": [
    "openai-frontier-agent-platform-enterprise",
    "metagpt-rebrands-atoms-ai-business-building",
  ],

  // === Open Source cluster ===
  "deepseek-new-model-not-v3-2-confirmed": [
    "blog-2026-05-15-lrh6ar",
    "api-pricing-may-2026",
    "stepfun-step-3-5-flash-sparse-moe",
  ],
  "grok-4-2-beta-release-free-access": [
    "openai-gpt-5-5-spud-release",
    "claude-opus-4-7-overview",
  ],
  "stepfun-step-3-5-flash-sparse-moe": [
    "sparser-faster-lighter-transformer-language-models",
    "qwen3-6-35b-a3b-open-source-agent",
  ],
  "company-behind-gliner-model-released-open-source-model-for-running-llm-guardrail": [
    "openai-daybreak-ai-anthropic",
    "claude-mythos-preview-capabilities-openbsd-zero-day",
  ],

  // === Cross-cutting ===
  "api-pricing-may-2026": [
    "gpt-5-2-benchmark-review",
    "claude-opus-4-7-overview",
    "deepseek-new-model-not-v3-2-confirmed",
  ],
  "blog-2026-05-15-lrh6ar": [
    "deepseek-new-model-not-v3-2-confirmed",
    "api-pricing-may-2026",
  ],
  "google-android-ai-os": [
    "openai-frontier-agent-platform-enterprise",
    "qwen3-6-35b-a3b-open-source-agent",
  ],
};

// ── Load all posts to get titles ──

interface PostInfo {
  slug: string;
  title: string;
}

function loadAllPosts(): Map<string, PostInfo> {
  const posts = new Map<string, PostInfo>();
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    posts.set(slug, { slug, title: data.title || slug });
  }

  return posts;
}

// ── Main ──

function main() {
  const allPosts = loadAllPosts();
  let updated = 0;
  let skipped = 0;

  console.log("═══════════════════════════════════════");
  console.log("  内鏈追加 (関連記事)");
  console.log("═══════════════════════════════════════\n");

  for (const [slug, relatedSlugs] of Object.entries(RELATED)) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ Not found: ${slug}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf-8");

    // Skip if already has 関連記事 section
    if (raw.includes("## 関連記事")) {
      skipped++;
      continue;
    }

    // Build related links
    const validLinks = relatedSlugs
      .filter((s) => allPosts.has(s))
      .slice(0, 3)
      .map((s) => {
        const post = allPosts.get(s)!;
        return `- [${post.title}](/blog/${s})`;
      });

    if (validLinks.length === 0) {
      skipped++;
      continue;
    }

    const relatedSection = `\n\n---\n\n## 関連記事\n\n${validLinks.join("\n")}\n`;

    if (APPLY) {
      const newContent = raw.trimEnd() + relatedSection;
      fs.writeFileSync(filePath, newContent, "utf-8");
      console.log(`  ✓ ${slug} → ${validLinks.length} links`);
    } else {
      console.log(`  [dry-run] ${slug} → ${validLinks.length} links:`);
      for (const link of validLinks) {
        console.log(`    ${link}`);
      }
    }
    updated++;
  }

  console.log(`\n  ${APPLY ? "Updated" : "Would update"}: ${updated}, Skipped: ${skipped}`);

  if (!APPLY) {
    console.log("\n  Run with --apply to write changes.");
  }
}

main();
