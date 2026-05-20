# AI Models Navi — Project Guide

## Project Overview

AI Models Navi (aimodelsnavi.com) is a **Japanese-language AI model comparison website**, similar to DataLearnerAI (datalearner.com). It helps Japanese developers and businesses compare AI models by benchmarks, API pricing, and specifications.

**Target audience**: Japanese developers and technical decision-makers.

**Live site**: https://aimodelsnavi.com (deployed on Vercel)
**Repository**: https://github.com/focusontec/aimodelnavi (private)

## Tech Stack

- **Framework**: Next.js 16.2.6 with App Router (static export / SSG)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI**: Lucide React icons, no component library
- **Database**: SQLite (`better-sqlite3`) at `data/crawler.db` — build-time only, NOT in Vercel runtime
- **Deployment**: Vercel (auto-deploy from GitHub main branch)
- **CI/CD**: GitHub Actions (`daily-pipeline.yml`) runs daily at 07:03 UTC

## Architecture: 5-Stage Crawler Pipeline

The core of this project is a **crawl → store → process → translate → generate** pipeline that fetches AI model data from external sources, enriches it with AI, and produces static TypeScript files for the website.

```
DataLearnerAI ──┐                      ┌──→ src/data/models.ts
HuggingFace API ─┤── Crawl → SQLite ───┤──→ src/data/leaderboard.ts
                 │   ↓    ↓   ↓        └──→ src/data/pricing.ts
                 │  Process Translate
                 │  (AI rewrite  (ja/en/ko)
                 │   + enrich)
LMSYS Arena ─────┤── Leaderboard → leaderboard_scores
Provider sites ───┘── Pricing → pricing_entries
```

**Key insight**: SQLite is a **build-time artifact**. The website is fully static — DB is only used during crawl/generate. Vercel serves pre-built HTML.

### Pipeline Entry Point

```bash
npx tsx scripts/sync-all.ts              # incremental (default)
npx tsx scripts/sync-all.ts --full       # full crawl (all pages)
npx tsx scripts/sync-all.ts --generate   # only regenerate TypeScript files
```

### Script Structure

```
scripts/
  sync-all.ts                # Unified orchestrator (entry point for CI)
  migrate-seed.ts            # One-time: import hand-curated models into SQLite
  generate-blog.ts           # Blog generation from HackerNews/Reddit
  lib/
    anthropic.ts              # LLM API wrapper (Ollama/Anthropic/OpenAI)
    storage.ts                # File I/O for src/data/ and src/content/
    db.ts                     # SQLite connection, migrations, CRUD helpers
    http.ts                   # Rate-limited fetch with retry & caching
  sources/
    datalearner.ts            # DataLearnerAI JSON-LD crawler
    huggingface.ts            # HuggingFace REST API crawler (Japanese models)
  pipeline/
    crawl-all.ts              # Orchestrate all crawlers
    process-models.ts         # AI rewrite/enrich raw data → models table
    translate-models.ts        # Multi-language translation
    sync-leaderboard.ts       # Leaderboard data → leaderboard_scores table
    sync-pricing.ts           # Pricing data → pricing_entries table
    generate-data-files.ts    # Generate all 4 TypeScript files from DB
```

## SQLite Schema (8 tables)

- `data_sources` — Crawl source registry (datalearner, huggingface, leaderboard, pricing, manual)
- `raw_crawl_log` — HTTP request audit log
- `raw_models` — Raw JSON blobs, deduplicated by `content_hash` on `(source_id, external_id)`
- `models` — Unified model registry (single source of truth). `is_core=1` protects hand-curated content from AI overwrite
- `model_translations` — Multi-language support (ja/en/ko)
- `leaderboard_scores` — Benchmark scores, UNIQUE on `(model_id, benchmark, source_url)`
- `pricing_entries` — API pricing, UNIQUE on `(model_name, provider, billing_mode)`
- `model_source_map` — Links models to their source data

## Data Sources

1. **DataLearnerAI** (datalearner.com) — Primary source, 240+ models
   - List pages: JSON-LD `ItemList` with model slugs
   - Detail pages: `SoftwareApplication` JSON-LD (name, developer, Chinese description, releaseDate, license, offers, sameAs)
   - Full crawl: 5 list pages; Incremental: page 1 only

2. **HuggingFace API** — Japanese domestic models
   - REST API: `GET https://huggingface.co/api/models?author={org}`
   - Japanese orgs: pfnet, sakana-ai, elyza, rinna, llm-jp, cyberagent, stabilityai, stockmark, nttcslab, line-corporation, abeja
   - May be blocked from China (network issue, not code bug)

3. **LMSYS Chatbot Arena** — Elo rankings
4. **Provider pricing pages** — OpenAI, Anthropic, Google DeepMind, DeepSeek, xAI (some need Playwright for JS rendering)

## LLM Configuration

Environment variables:
- `LLM_PROVIDER` — "ollama" (default) | "anthropic" | "openai"
- `LLM_API_KEY` — API key for the chosen provider
- `LLM_MODEL` — Model name (default: `gemma4:31b` for Ollama)
- `LLM_BASE_URL` — Override base URL (optional)

Ollama Cloud endpoint: `https://ollama.com/v1/chat/completions`

## Website Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with stats and links |
| `/models` | Model list (250+ models from DB) |
| `/models/[slug]` | Model detail (SSG with generateStaticParams) |
| `/leaderboard` | Benchmark ranking table |
| `/pricing` | API pricing comparison |
| `/blog` + `/blog/[slug]` | Japanese blog posts |
| `/tools/cost-calculator` | API cost calculator |
| `/tools/model-compare` | Side-by-side model comparison |
| `/tools/token-counter` | Token counter |
| `/about` | About page (contact: contact@aimodelsnavi.com) |

## Generated Data Files

All in `src/data/`, auto-generated by pipeline — **DO NOT EDIT MANUALLY**:
- `models.ts` — `ModelDetail[]` with `modelDetails` export + `getModelBySlug()` helper
- `model-slugs.ts` — `allModelSlugs[]` for `generateStaticParams`
- `leaderboard.ts` — `ModelRanking[]` with `leaderboardData` export
- `pricing.ts` — `PricingEntry[]` with `pricingData` export + `BillingMode` type

## Key Design Decisions

1. **SQLite committed to Git** — Simple, no external DB service needed. DB is ~600KB for 250 models.
2. **`is_core=1` flag** — 17 hand-curated models are protected from AI overwrite. Only NULL fields get filled.
3. **Incremental by default** — `content_hash` dedup, `last_seen_at` tracking, only process changed models.
4. **Japanese-first** — All user-facing content is in Japanese. Chinese source text is AI-translated to natural Japanese.
5. **Static site** — No server-side rendering at runtime. All pages pre-built via SSG.
6. **Multi-language ready** — `model_translations` table supports adding en/ko/etc. in the future.

## Common Commands

```bash
npm run dev                    # Start dev server
npm run build                  # Production build (must work before deploying)
npx tsx scripts/sync-all.ts   # Run pipeline (incremental)
npx tsx scripts/migrate-seed.ts  # Import hand-curated models (one-time, already done)
```

## Blog Publishing (CN → JP)

The site supports publishing Chinese-written articles that are automatically translated to Japanese.

### Two publishing modes

**Mode 1: Direct Markdown (no images)**
```bash
./scripts/publish-blog.sh <chinese-article.md> --yes
```
Triggers GitHub Actions to translate and deploy.

**Mode 2: From URL with image filtering (recommended for web articles)**
```bash
# Step 1: Fetch article + download images + filter promo images
npx tsx scripts/fetch-article.ts "<URL>" --filter-images

# Step 2: Local translation + publish
./scripts/publish-blog.sh _drafts/<slug>.md --local --yes
```

### fetch-article.ts — URL to Markdown

Fetches article content from a URL using Playwright, downloads images, generates Chinese Markdown.

```bash
npx tsx scripts/fetch-article.ts "<URL>"                     # basic fetch
npx tsx scripts/fetch-article.ts "<URL>" --filter-images     # with AI image filtering
npx tsx scripts/fetch-article.ts "<URL>" --no-images         # skip image download
npx tsx scripts/fetch-article.ts "<URL>" --tag "Anthropic"   # set tag
```

Supported sites: WeChat (微信公众号), Zhihu, CSDN, Juejin, sspai, jianshu, and general web pages.

Output: `_drafts/<slug>.md` + `public/images/blog/<slug>/`

### Image filtering (--filter-images)

Two-layer filtering to remove promotional/ad images:

1. **Heuristic filter**: keyword matching (二维码, 扫码, 关注, 公众号, etc.)
2. **AI Vision filter**: Gemma3:27b-cloud classifies each image as:
   - `promo` → rejected (QR codes, ads, subscription banners)
   - `chinese_text` → rejected (images with Chinese text)
   - `content` → kept (charts, diagrams, technical screenshots)

Requires: `LLM_API_KEY` env var, Ollama with vision model.

### publish-blog.sh — Publish article

```bash
./scripts/publish-blog.sh <file.md>              # remote mode (GitHub Actions)
./scripts/publish-blog.sh <file.md> --local      # local mode (translate + commit locally)
./scripts/publish-blog.sh <file.md> --yes        # skip confirmation prompt
```

**Remote mode**: Triggers GitHub Actions workflow. Good for articles with remote image URLs.
**Local mode**: Translates locally, handles downloaded images, commits directly. Good for fetch-article.ts output.

The script auto-detects local image paths (`/images/blog/...`) vs remote URLs (`https://...`).

### translate-blog.ts — CN→JP translation

```bash
# From file
npx tsx scripts/translate-blog.ts <file.md>

# From stdin (GitHub Actions mode)
echo "$CONTENT" | npx tsx scripts/translate-blog.ts --title "标题" --tag "Tag" --stdin

# With custom slug (preserves image directory)
npx tsx scripts/translate-blog.ts <file.md> --slug my-article-slug
```

### Chinese Markdown format

```markdown
---
title: "文章标题"
tag: "Anthropic"        # optional, default: 解説
excerpt: "摘要"         # optional, LLM generates Japanese one if empty
---

正文内容（支持完整 Markdown：标题、代码块、列表、链接、表格等）
```

### Available tags

OpenAI, Anthropic, Google, オープンソース, ベンチマーク, チュートリアル, AIエージェント, xAI, DeepSeek, 解説, 速報, 料金比較

### Default workflow for Claude Code (URL → 微調 → 発布)

**This is the primary workflow. Use it whenever the user provides a URL.**

```bash
# Step 1: Fetch article + download images + filter promo images
npx tsx scripts/fetch-article.ts "<user-provided-url>" --filter-images

# Step 2: Review and edit the draft in _drafts/
# - Remove any WeChat links, video prompts, unwanted sections
# - Adjust formatting if needed
# - Keep all images

# Step 3: Publish with local translation
./scripts/publish-blog.sh _drafts/<slug>.md --local --yes
```

**Why this workflow:**
- Images are automatically downloaded and included
- Content is based on real source material (no hallucination)
- AI image filtering removes promo/ad images
- Local translation preserves image paths

### Writing rules for Claude Code

**CRITICAL: Every article MUST have images.** Articles without images are unacceptable.

**NEVER include in articles:**
- WeChat/微信公众号 links (https://mp.weixin.qq.com/s/...)
- "参考" or "Source" sections at the end
- "画像出典" or "データ出典" attributions
- "翻译自" or "翻訳元" disclaimers
- Raw video prompts (code blocks with video generation instructions)
- Video references that cannot be embedded (e.g., "動画ソース：X@...")

**When editing the fetched draft:**
- Remove WeChat links (replace with plain text)
- Remove video-only references that can't be embedded
- Keep all images (they are already downloaded locally)
- Do NOT rewrite the article from scratch — make minimal edits

### Complete workflow for Claude Code

When given a Chinese article URL:

```bash
# 1. Fetch article with image filtering
npx tsx scripts/fetch-article.ts "https://..." --filter-images

# 2. Review and clean up the draft
#    - Remove any WeChat links
#    - Remove video references that can't be embedded
#    - Verify images are present

# 3. Publish with local translation
./scripts/publish-blog.sh _drafts/<slug>.md --local --yes
```

When given Chinese Markdown directly:

```bash
# Save to file, then publish
./scripts/publish-blog.sh _drafts/<filename>.md --yes
```

### Infrastructure

- **GitHub Actions**: `.github/workflows/publish-blog.yml` (workflow_dispatch)
- **Translation**: `scripts/translate-blog.ts` + `translateBlogMarkdown()` in `scripts/lib/anthropic.ts`
- **Image filter**: `scripts/lib/image-filter.ts` (shared by fetch-article.ts and sync-blog.ts)
- **LLM_API_KEY**: stored as GitHub Environment Secret in `LLM_API_KEY` environment

## Known Issues

- **HuggingFace API connectivity**: May fail from China due to network restrictions. Code is correct, needs network access.
- **Ollama Cloud API timeouts**: May timeout on large batches. Pipeline continues with fallback descriptions.
- **Vercel access from China**: aimodelnavi.vercel.app may be blocked by GFW. Custom domain (aimodelsnavi.com) via Cloudflare may help.

## Branding

- Site name: **AI Models Navi**
- Domain: **aimodelsnavi.com**
- Email: **contact@aimodelsnavi.com**
- User-Agent: **AIModelsNavi/1.0**
- CI bot: **aimodelsnavi-bot** / bot@aimodelsnavi.com

## User Preferences

- Database storage: Git-committed SQLite (no external services)
- Implementation: Phased approach (DL first → HuggingFace → leaderboard/pricing)
- Language priority: Japanese first, future support for English/Korean
- Content quality: Natural, idiomatic Japanese for developers
- Core model content: Must be preserved (is_core=1, priority=10)
- Blog publishing: Use Claude Code only (not OpenClaw) with fetch-article.ts + publish-blog.sh --local
- Every article must include images from the original source