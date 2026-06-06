import { setRequestLocale } from "next-intl/server";
import { modelDetails, type ModelDetail } from "@/data/models";
import { getModelAnalysis } from "@/data/model-analyses";
import { leaderboardData, type ModelRanking } from "@/data/leaderboard";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CustomCompare from "@/components/custom-compare";

const T = {
  ja: {
    title: "AIモデル比較 — 人気モデルの性能・価格対決",
    description: "GPT、Claude、Gemini、DeepSeekなど人気AIモデルをベンチマーク・API料金・性能で徹底比較。あなたに最適なモデルが見つかります。",
    compareTitle: "モデル比較",
    compareSub: "人気のAIモデルを性能・価格・特徴で比較",
    viewDetail: "詳細を見る",
    vs: "VS",
    customTitle: "モデルを自由に比較",
    customSub: "気になるモデルを選んで性能・価格を並べて比較",
    searchPlaceholder: "モデル名または開発元で検索...",
    addModel: "モデルを追加",
    noResults: "見つかりません",
    inputPrice: "入力価格",
    outputPrice: "出力価格",
    context: "コンテキスト",
    noData: "—",
    model: "モデル",
  },
  en: {
    title: "AI Model Comparison — Performance & Price Showdown",
    description: "Compare popular AI models like GPT, Claude, Gemini, DeepSeek by benchmarks, API pricing, and features. Find the best model for you.",
    compareTitle: "Model Comparison",
    compareSub: "Compare popular AI models by performance, price, and features",
    viewDetail: "View Details",
    vs: "VS",
    customTitle: "Compare Models Your Way",
    customSub: "Pick any models to compare performance and pricing side by side",
    searchPlaceholder: "Search by model name or developer...",
    addModel: "Add Model",
    noResults: "No results found",
    inputPrice: "Input Price",
    outputPrice: "Output Price",
    context: "Context Window",
    noData: "—",
    model: "Model",
  },
};

// High-value comparison pairs for "vs" keyword SEO
const COMPARE_PAIRS: { a: string; b: string; highlight?: string; benchmarkKey?: string }[] = [
  { a: "claude-opus-4-8", b: "gpt-5-5", highlight: "SWE-Bench Pro", benchmarkKey: "sweBenchPro" },
  { a: "gpt-5-2", b: "claude-opus-4-7", highlight: "GPQA Diamond", benchmarkKey: "gpqaDiamond" },
  { a: "gpt-5-2", b: "gemini-3-0-pro", highlight: "ARC-AGI-2", benchmarkKey: "arcAgi2" },
  { a: "claude-opus-4-7", b: "gemini-3-0-pro", highlight: "Agentic" },
  { a: "deepseek-v3-2", b: "gpt-5-2", highlight: "Price/Perf" },
  { a: "qwen3-6-27b", b: "llama-3-namazu-405b", highlight: "Open-Weight" },
  { a: "gpt-5-1-codex-max", b: "claude-opus-4-7", highlight: "Coding" },
  { a: "grok-4-2-beta", b: "gpt-5-2", highlight: "Real-time" },
  { a: "gemma-4-31b", b: "qwen3-6-27b", highlight: "Local Deploy" },
];

function getModelBySlug(slug: string): ModelDetail | undefined {
  return modelDetails.find((m) => m.slug === slug);
}

function getQuickMetrics(slug: string, locale: string) {
  const analysis = getModelAnalysis(slug, locale);
  if (!analysis || !analysis.keyMetrics) return [];
  return analysis.keyMetrics.slice(0, 3);
}

function findRanking(slug: string): ModelRanking | undefined {
  const model = modelDetails.find((m) => m.slug === slug);
  if (!model) return undefined;
  const lower = model.name.toLowerCase();
  return leaderboardData.find((r) => r.name.toLowerCase() === lower);
}

const HIGHLIGHT_BENCHMARKS: { key: string; label: string }[] = [
  { key: "sweBenchPro", label: "SWE-Bench Pro" },
  { key: "gpqaDiamond", label: "GPQA Diamond" },
  { key: "arcAgi2", label: "ARC-AGI-2" },
  { key: "hle", label: "HLE" },
  { key: "frontierMath", label: "FrontierMath" },
  { key: "sweBenchVerified", label: "SWE-bench Verified" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.description,
    keywords: ["AI model comparison", "GPT vs Claude", "LLM benchmark comparison", "AI API pricing compare", locale === "ja" ? "AIモデル比較" : "AI model comparison"],
    openGraph: {
      title: t.title,
      description: t.description,
      type: "website",
      images: ["/opengraph-image"],
      url: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/compare`,
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/compare`,
      languages: {
        ja: "https://aimodelsnavi.com/compare",
        en: "https://aimodelsnavi.com/en/compare",
        "x-default": "https://aimodelsnavi.com/compare",
      },
    },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  const validPairs = COMPARE_PAIRS.map((pair) => ({
    ...pair,
    modelA: getModelBySlug(pair.a),
    modelB: getModelBySlug(pair.b),
    metricsA: getQuickMetrics(pair.a, locale),
    metricsB: getQuickMetrics(pair.b, locale),
  })).filter((p) => p.modelA && p.modelB);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === "en" ? "Home" : "ホーム",
        "item": "https://aimodelsnavi.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t.compareTitle,
        "item": `https://aimodelsnavi.com${locale === "ja" ? "" : "/en"}/compare`,
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{t.compareTitle}</h1>
        <p className="mt-2 text-gray-600">{t.compareSub}</p>
      </div>

      <Suspense fallback={null}>
        <CustomCompare
          models={modelDetails}
          rankings={leaderboardData}
          locale={locale}
          labels={{
            title: t.customTitle,
            subtitle: t.customSub,
            searchPlaceholder: t.searchPlaceholder,
            addModel: t.addModel,
            noResults: t.noResults,
            inputPrice: t.inputPrice,
            outputPrice: t.outputPrice,
            context: t.context,
            noData: t.noData,
            model: t.model,
          }}
        />
      </Suspense>

      <div className="grid md:grid-cols-2 gap-6">
        {validPairs.map((pair) => {
          const rankA = findRanking(pair.a);
          const rankB = findRanking(pair.b);
          return (
            <div
              key={`${pair.a}-${pair.b}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div className="flex-1">
                  <Link
                    href={`/${locale === "ja" ? "" : locale + "/"}models/${pair.modelA!.slug}`}
                    className="text-lg font-bold text-primary-700 hover:underline"
                  >
                    {pair.modelA!.name}
                  </Link>
                  <p className="text-xs text-gray-500">{pair.modelA!.developer}</p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="bg-gray-100 rounded-full px-3 py-1 text-sm font-bold text-gray-700">
                    {t.vs}
                  </div>
                  {pair.highlight && (
                    <span className="text-xs font-medium text-primary-600 mt-1">{pair.highlight}</span>
                  )}
                </div>

                <div className="flex-1 sm:text-right">
                  <Link
                    href={`/${locale === "ja" ? "" : locale + "/"}models/${pair.modelB!.slug}`}
                    className="text-lg font-bold text-primary-700 hover:underline"
                  >
                    {pair.modelB!.name}
                  </Link>
                  <p className="text-xs text-gray-500">{pair.modelB!.developer}</p>
                </div>
              </div>

              {/* Benchmark comparison */}
              {rankA && rankB && (
                <div className="mb-3 space-y-1">
                  {HIGHLIGHT_BENCHMARKS.map((bm) => {
                    const valA = rankA[bm.key as keyof ModelRanking] as number | null;
                    const valB = rankB[bm.key as keyof ModelRanking] as number | null;
                    if (valA == null && valB == null) return null;
                    const winner = valA != null && valB != null ? (valA > valB ? "a" : valA < valB ? "b" : null) : valA != null ? "a" : "b";
                    return (
                      <div key={bm.key} className="flex items-center text-xs gap-2">
                        <span className={`w-[100px] text-right font-mono ${winner === "a" ? "text-primary-700 font-bold" : "text-gray-600"}`}>
                          {valA != null ? valA : "—"}
                        </span>
                        <span className="text-gray-400 flex-1 text-center">{bm.label}</span>
                        <span className={`w-[100px] font-mono ${winner === "b" ? "text-primary-700 font-bold" : "text-gray-600"}`}>
                          {valB != null ? valB : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/${locale === "ja" ? "" : locale + "/"}models/${pair.modelA!.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {pair.modelA!.name} {t.viewDetail} <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/${locale === "ja" ? "" : locale + "/"}models/${pair.modelB!.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {pair.modelB!.name} {t.viewDetail} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
