import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import RecommendResults from "@/components/RecommendResults";

const T = {
  ja: {
    title: "用途別おすすめモデル",
    desc: "あなたの使いたい目的に最適なAIモデルを提案します。コード生成、文章作成、データ分析など、8つのシナリオから選びましょう。",
  },
  en: {
    title: "Scenario-Based Recommendations",
    desc: "Find the best AI model for your specific use case. Choose from 8 scenarios: code generation, writing, data analysis, and more.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.desc,
    alternates: {
      canonical: "https://aimodelsnavi.com/recommend",
      languages: { ja: "https://aimodelsnavi.com/recommend", en: "https://aimodelsnavi.com/en/recommend", "x-default": "https://aimodelsnavi.com/recommend" },
    },
  };
}

export default async function RecommendPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          {t.title}
        </h1>
        <p className="mt-2 text-gray-500">{t.desc}</p>
      </div>

      <RecommendResults />
    </div>
  );
}
