import Link from "next/link";
import type { Metadata } from "next";
import { leaderboardCategories, categoryOrder } from "@/lib/leaderboard-categories";
import { benchmarksData } from "@/data/benchmarks";
import LeaderboardTable from "@/components/LeaderboardTable";

export const metadata: Metadata = {
  title: "AIモデルランキング — AI Models Navi",
  description: "HLE、ARC-AGI-2、FrontierMath、SWE-bench Verified、τ²-Bench など17種類のベンチマークによるAIモデル総合ランキング。",
  alternates: {
    canonical: "https://aimodelsnavi.com/leaderboard",
  },
};

export default function LeaderboardPage() {
  // Comprehensive category benchmarks for the main table
  const mainBenchmarks = ["hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench"];
  const mainBenchmarkDefs = mainBenchmarks
    .map((key) => benchmarksData.find((b) => b.key === key))
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AIモデルランキング</h1>
        <p className="mt-2 text-gray-500">
          17種類のベンチマークによるAIモデル総合ランキング。カテゴリ別に詳細な比較が可能です。
        </p>
      </div>

      {/* Category cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {categoryOrder.map((slug) => {
          const cat = leaderboardCategories[slug];
          const Icon = cat.icon;
          return (
            <Link
              key={slug}
              href={`/leaderboard/${slug}`}
              className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {cat.title}
                </h2>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
              <p className="mt-2 text-xs text-gray-400">
                {cat.benchmarks.length} ベンチマーク
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main comprehensive table */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">総合ランキング</h2>
        <p className="text-sm text-gray-500">HLE、ARC-AGI-2、FrontierMath、SWE-bench、τ²-Bench の総合スコア</p>
      </div>

      <LeaderboardTable
        benchmarks={mainBenchmarks}
        benchmarkDefs={mainBenchmarkDefs}
      />
    </div>
  );
}
