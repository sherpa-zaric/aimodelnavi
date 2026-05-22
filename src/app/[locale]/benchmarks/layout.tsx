import type { Metadata } from "next";

const META: Record<string, { title: string; description: string; ogTitle: string; ogDesc: string }> = {
  ja: {
    title: "AI モデル評価ベンチマーク",
    description: "业界主流の AI モデル評価ベンチマーク一覧。各ベンチマークの説明と、モデルのランキングを確認できます。",
    ogTitle: "AI モデル評価ベンチマーク | AI Models Navi",
    ogDesc: "主要AIベンチマークの解説とモデルランキング。",
  },
  en: {
    title: "AI Model Evaluation Benchmarks",
    description: "Comprehensive list of major AI model evaluation benchmarks. View benchmark descriptions and model rankings.",
    ogTitle: "AI Model Evaluation Benchmarks | AI Models Navi",
    ogDesc: "Descriptions and rankings for major AI benchmarks.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] || META.ja;
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.ogTitle, description: m.ogDesc },
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/benchmarks`,
      languages: {
        ja: "https://aimodelsnavi.com/benchmarks",
        en: "https://aimodelsnavi.com/en/benchmarks",
        "x-default": "https://aimodelsnavi.com/benchmarks",
      },
    },
  };
}

export default function BenchmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
