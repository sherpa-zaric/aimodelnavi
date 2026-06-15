import type { Metadata } from "next";
import Client from "./client";

const META = {
  ja: { title: "AI APIコスト計算機", desc: "AIモデルのAPI使用量から月額コストを自動計算。最適なモデルを選択。" },
  en: { title: "AI API Cost Calculator", desc: "Calculate monthly API costs from usage. Find the best model for your budget." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale as keyof typeof META] || META.ja;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/tools/cost-calculator`,
      languages: { ja: "https://aimodelsnavi.com/tools/cost-calculator", en: "https://aimodelsnavi.com/en/tools/cost-calculator", "x-default": "https://aimodelsnavi.com/tools/cost-calculator" },
    },
  };
}

export default function Page() {
  return <Client />;
}
