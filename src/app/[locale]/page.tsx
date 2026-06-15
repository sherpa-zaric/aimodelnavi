import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { PopularModels } from "@/components/home/PopularModels";
import { Tools } from "@/components/home/Tools";
import { LatestBlog } from "@/components/home/LatestBlog";
import blogManifest from "@/data/blog-manifest.json";
import blogManifestEn from "@/data/blog-manifest-en.json";

const T = {
  ja: {
    hero: "最適なAIモデルを、", hero2: "最短で見つける",
    heroSub: "ベンチマーク比較、API料金、モデル仕様まで。OpenAI、Anthropic、Google、DeepSeekなど、主要AIモデルを日本語で徹底比較。",
    searchPlaceholder: "モデル名で検索...",
    viewRankings: "ランキングを見る", comparePricing: "API料金を比較",
    modelsListed: "掲載モデル", pricingData: "API料金データ", dailyUpdate: "最新情報", dailyUpdateVal: "毎日更新",
    value1Title: "ベンチマーク比較", value1Desc: "200+モデルのベンチマークスコアを一覧比較",
    value2Title: "API料金比較", value2Desc: "160+モデルのAPI料金データでコスト計算",
    value3Title: "毎日更新", value3Desc: "最新のモデル情報とベンチマークデータを毎日更新",
    popularModels: "人気のモデル", latestBlog: "最新ブログ", viewAll: "すべて見る",
    toolsTitle: "便利ツール", toolsSub: "AIモデルの選定とコスト計算をサポートするツール集",
    tool1Title: "Token Counter", tool1Desc: "テキストのトークン数を計算。プロンプトコストを事前に見積もり。",
    tool2Title: "コスト計算機", tool2Desc: "API使用量から月額コストを自動計算。予算に合ったモデルを選択。",
    tool3Title: "モデル比較", tool3Desc: "2つのモデルを並列比較。ベンチマーク・料金・性能を一目で確認。",
    tool4Title: "AIモデル推薦", tool4Desc: "4つの質問に答えて、あなたに最適なAIモデルを見つけましょう。",
    tool5Title: "コンテキスト比較", tool5Desc: "各モデルのコンテキストサイズを視覚的に比較。",
    tryNow: "使ってみる",
  },
  en: {
    hero: "Find the Best AI Model,", hero2: "Fast",
    heroSub: "Benchmark comparisons, API pricing, and model specs. Compare OpenAI, Anthropic, Google, DeepSeek, and more.",
    searchPlaceholder: "Search by model name...",
    viewRankings: "View Rankings", comparePricing: "Compare Pricing",
    modelsListed: "Models Listed", pricingData: "Pricing Entries", dailyUpdate: "Updated Daily", dailyUpdateVal: "Updated Daily",
    value1Title: "Benchmark Comparisons", value1Desc: "Compare benchmark scores across 200+ models",
    value2Title: "API Pricing Data", value2Desc: "Cost calculations with 160+ model pricing entries",
    value3Title: "Daily Updates", value3Desc: "Latest model info and benchmark data updated daily",
    popularModels: "Popular Models", latestBlog: "Latest Blog", viewAll: "View All",
    toolsTitle: "Developer Tools", toolsSub: "Tools to help you choose the right AI model and estimate costs",
    tool1Title: "Token Counter", tool1Desc: "Count tokens in your text. Estimate prompt costs before you run.",
    tool2Title: "Cost Calculator", tool2Desc: "Calculate monthly API costs based on your usage. Pick models that fit your budget.",
    tool3Title: "Model Compare", tool3Desc: "Compare two models side by side. Benchmarks, pricing, and performance at a glance.",
    tool4Title: "AI Model Recommender", tool4Desc: "Answer 4 questions to find the perfect AI model for your needs.",
    tool5Title: "Context Visualizer", tool5Desc: "Visually compare context window sizes across models.",
    tryNow: "Try Now",
  },
};

const PAGE_TITLES: Record<string, string> = {
  ja: "AIモデル比較・料金・ランキング — AI Models Navi",
  en: "AI Model Comparison, Pricing & Rankings — AI Models Navi",
};

const popularModels = [
  { name: "Claude Opus 4.8", highlight: "最高品質", slug: "claude-opus-4-8" },
  { name: "GPT-5.5", highlight: "バランス型", slug: "gpt-5-5" },
  { name: "Gemini 3.0 Pro", highlight: "長文対応", slug: "gemini-3-0-pro" },
  { name: "MiniMax M3", highlight: "コスパ最強", slug: "minimax-m3" },
  { name: "DeepSeek V3.2", highlight: "低コスト", slug: "deepseek-v3-2" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: { absolute: PAGE_TITLES[locale as keyof typeof PAGE_TITLES] || PAGE_TITLES.ja },
    description: t.heroSub,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}`,
      languages: {
        ja: "https://aimodelsnavi.com",
        en: "https://aimodelsnavi.com/en",
        "x-default": "https://aimodelsnavi.com",
      },
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  const manifest = locale === "en" ? blogManifestEn : blogManifest;
  const sortedPosts = [...manifest].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  return (
    <div>
      <Hero locale={locale} t={t} />
      <ValueProps t={t} />
      <PopularModels locale={locale} t={t} models={popularModels} />
      <Tools locale={locale} t={t} />
      <LatestBlog locale={locale} t={t} posts={sortedPosts} />
    </div>
  );
}
