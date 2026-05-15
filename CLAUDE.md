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

### How it works

```
Chinese Markdown → GitHub Actions → LLM translation → Japanese blog post → Vercel deploy
```

### Publish via script (recommended for OpenClaw)

```bash
./scripts/publish-blog.sh <chinese-article.md>
```

This script:
1. Reads Chinese Markdown (with frontmatter: title, tag, excerpt)
2. Triggers GitHub Actions `publish-blog.yml` via `gh` CLI (authenticated, no extra token needed)
3. GitHub Actions calls LLM to translate Chinese → Japanese
4. Saves to `src/content/blog/{slug}.md`
5. Auto-commits and pushes → Vercel deploys

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

### Infrastructure

- **GitHub Actions**: `.github/workflows/publish-blog.yml` (workflow_dispatch)
- **Translation script**: `scripts/translate-blog.ts`
- **LLM function**: `translateBlogMarkdown()` in `scripts/lib/anthropic.ts`
- **LLM_API_KEY**: stored as GitHub Environment Secret in `LLM_API_KEY` environment (shared with daily-pipeline)

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