import { setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { leaderboardCategories, categoryOrder } from "@/lib/leaderboard-categories";
import { benchmarksData } from "@/data/benchmarks";
import LeaderboardTable from "@/components/LeaderboardTable";

export function generateStaticParams() {
  return categoryOrder.flatMap((slug) =>
    ["ja", "en", "zh", "ko"].map((locale) => ({ category: slug, locale }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = leaderboardCategories[category];
  if (!cat) return {};

  return {
    title: `${cat.title} — AI Models Navi`,
    description: cat.description,
    openGraph: {
      title: `${cat.title} | AI Models Navi`,
      description: cat.description,
      type: "website",
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `https://aimodelsnavi.com/leaderboard/${category}`,
    },
  };
}

export default async function LeaderboardCategoryPage({
  params,
}: {
  params: Promise<{ category: string; locale: string }>;
}) {
  const { category, locale } = await params;
  setRequestLocale(locale);
  const cat = leaderboardCategories[category];
  if (!cat) notFound();

  // Get benchmark definitions for this category
  const categoryBenchmarks = cat.benchmarks
    .map((key) => benchmarksData.find((b) => b.key === key))
    .filter(Boolean);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://aimodelsnavi.com" },
      { "@type": "ListItem", position: 2, name: "ランキング", item: "https://aimodelsnavi.com/leaderboard" },
      { "@type": "ListItem", position: 3, name: cat.title },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        ランキング一覧に戻る
      </Link>

      {/* Category nav tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
        {categoryOrder.map((slug) => {
          const c = leaderboardCategories[slug];
          const Icon = c.icon;
          return (
            <Link
              key={slug}
              href={`/leaderboard/${slug}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                slug === category
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {c.title.replace("ランキング", "")}
            </Link>
          );
        })}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{cat.title}</h1>
        <p className="mt-2 text-gray-500">{cat.description}</p>
      </div>

      {/* Table */}
      <LeaderboardTable
        benchmarks={cat.benchmarks}
        benchmarkDefs={categoryBenchmarks}
      />

      {/* Benchmark descriptions */}
      {categoryBenchmarks.length > 0 && (
        <div className="mt-10 p-6 bg-gray-50 rounded-xl">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">ベンチマークについて</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBenchmarks.map((b) => b && (
              <div key={b.key}>
                <dt className="text-sm font-medium text-gray-900">{b.name}</dt>
                <dd className="text-xs text-gray-500 mt-0.5">{b.description}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
