import type { Metadata } from "next";
import Client from "./client";

const META = {
  ja: { title: "API使用パターン分析", desc: "API使用ログを分析してコスト最適化の提案を受けましょう。" },
  en: { title: "API Usage Pattern Analyzer", desc: "Analyze API usage logs to get cost optimization recommendations." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale as keyof typeof META] || META.ja;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/tools/usage-analyzer`,
      languages: { ja: "https://aimodelsnavi.com/tools/usage-analyzer", en: "https://aimodelsnavi.com/en/tools/usage-analyzer", "x-default": "https://aimodelsnavi.com/tools/usage-analyzer" },
    },
  };
}

export default function Page() {
  return <Client />;
}
