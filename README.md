# AI Models Navi

AI Models Navi (aimodelsnavi.com) is a Japanese-language AI model comparison website. It helps Japanese developers and businesses compare AI models by benchmarks, API pricing, and specifications.

**Live**: https://aimodelsnavi.com

## Tech Stack

- Next.js 16 with App Router (SSG)
- TypeScript, Tailwind CSS v4, Lucide Icons
- SQLite (better-sqlite3) for build-time data
- Prisma Postgres (Vercel) for comments/likes
- Playwright for web scraping
- GitHub Actions CI/CD

## Getting Started

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
```

## Pipeline

```bash
npx tsx scripts/sync-all.ts          # Run full pipeline (incremental)
npx tsx scripts/sync-all.ts --full   # Full crawl
```

### Blog Publishing

```bash
# From URL (with images)
npx tsx scripts/fetch-article.ts "<URL>" --filter-images
./scripts/publish-blog.sh _drafts/<slug>.md --local --yes
```

## Project Structure

```
src/
├── app/            # Next.js pages
│   ├── admin/      # Admin dashboard
│   ├── api/        # API routes (comments, likes, admin)
│   ├── blog/       # Blog pages
│   ├── leaderboard/# Ranking pages (6 categories)
│   ├── models/     # Model detail pages (SSG)
│   └── tools/      # Cost calculator, model compare
├── components/     # Shared UI components
├── data/           # Auto-generated data files
└── lib/            # Shared utilities

scripts/
├── sync-all.ts     # Main pipeline orchestrator
├── fetch-article.ts# URL to Markdown with image extraction
├── translate-blog.ts # CN to JP translation
├── generate-blog.ts  # AI blog generation
├── generate-leaderboard-data.ts # Leaderboard data
└── pipeline/       # Crawler pipeline modules
```
