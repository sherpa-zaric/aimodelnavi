import type { Metadata } from "next";
import Client from "./client";

const META = {
  ja: { title: "AIモデル推薦", desc: "4つの質問に答えて最適なAIモデルを見つけましょう。" },
  en: { title: "AI Model Recommender", desc: "Answer 4 questions to find the perfect AI model for your needs." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale as keyof typeof META] || META.ja;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/tools/model-recommender`,
      languages: { ja: "https://aimodelsnavi.com/tools/model-recommender", en: "https://aimodelsnavi.com/en/tools/model-recommender", "x-default": "https://aimodelsnavi.com/tools/model-recommender" },
    },
  };
}

export default function Page() {
  return <Client />;
}
