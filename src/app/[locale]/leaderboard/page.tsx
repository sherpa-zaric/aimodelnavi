import Link from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { leaderboardCategories, categoryOrder } from "@/lib/leaderboard-categories";
import { benchmarksData } from "@/data/benchmarks";
import LeaderboardTable from "@/components/LeaderboardTable";

const T = {
  ja: {
    title: "AIモデルランキング",
    desc: "17種類のベンチマークによるAIモデル総合ランキング。カテゴリ別に詳細な比較が可能です。",
    benchmarks: "ベンチマーク",
    comprehensiveTitle: "総合ランキング",
    comprehensiveDesc: "HLE、ARC-AGI-2、FrontierMath、SWE-bench、τ²-Bench の総合スコア",
  },
  en: {
    title: "AI Model Rankings",
    desc: "Comprehensive AI model rankings across 17 benchmarks. Detailed comparisons by category.",
    benchmarks: "benchmarks",
    comprehensiveTitle: "Comprehensive Ranking",
    comprehensiveDesc: "Overall scores across HLE, ARC-AGI-2, FrontierMath, SWE-bench, and τ²-Bench",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.desc,
    alternates: { canonical: "https://aimodelsnavi.com/leaderboard" },
  };
}

export default async function LeaderboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;
  const isEn = locale === "en";

  const mainBenchmarks = ["hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench"];
  const mainBenchmarkDefs = mainBenchmarks
    .map((key) => benchmarksData.find((b) => b.key === key))
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-2 text-gray-500">{t.desc}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {categoryOrder.map((slug) => {
          const cat = leaderboardCategories[slug];
          const Icon = cat.icon;
          return (
            <Link
              key={slug}
              href={`/${locale === "ja" ? "" : locale + "/"}leaderboard/${slug}`}
              className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {isEn ? cat.titleEn : cat.title}
                </h2>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{isEn ? cat.descriptionEn : cat.description}</p>
              <p className="mt-2 text-xs text-gray-400">
                {cat.benchmarks.length} {t.benchmarks}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t.comprehensiveTitle}</h2>
        <p className="text-sm text-gray-500">{t.comprehensiveDesc}</p>
      </div>

      <LeaderboardTable
        benchmarks={mainBenchmarks}
        benchmarkDefs={mainBenchmarkDefs}
      />
    </div>
  );
}
