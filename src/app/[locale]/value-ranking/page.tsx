import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ValueRankingTable from "@/components/ValueRankingTable";

const T = {
  ja: {
    title: "コスパランキング",
    desc: "AIモデルの性能対コスト比ランキング。ベンチマークスコアをAPI料金で割ったバリュースコアで比較します。",
  },
  en: {
    title: "Cost-Effectiveness Ranking",
    desc: "AI model performance-to-cost ratio ranking. Compare models by value score (benchmark score divided by API cost).",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.desc,
    alternates: {
      canonical: "https://aimodelsnavi.com/value-ranking",
      languages: { ja: "https://aimodelsnavi.com/value-ranking", en: "https://aimodelsnavi.com/en/value-ranking", "x-default": "https://aimodelsnavi.com/value-ranking" },
    },
  };
}

export default async function ValueRankingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.title}
        </h1>
        <p className="mt-2 text-gray-500">{t.desc}</p>
      </div>

      <ValueRankingTable />
    </div>
  );
}
