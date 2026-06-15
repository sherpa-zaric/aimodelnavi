import type { Metadata } from "next";
import Client from "./client";

const META = {
  ja: { title: "トークンカウンター＆プロンプトコスト計算機", desc: "AIプロンプトのトークン数をカウントし、APIコストを推定。GPT・Claude・Geminiの料金比較。" },
  en: { title: "AI Token Counter & Prompt Cost Calculator", desc: "Count AI prompt tokens, estimate API costs, and compare pricing across GPT, Claude, Gemini, DeepSeek." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale as keyof typeof META] || META.ja;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/tools/token-counter`,
      languages: { ja: "https://aimodelsnavi.com/tools/token-counter", en: "https://aimodelsnavi.com/en/tools/token-counter", "x-default": "https://aimodelsnavi.com/tools/token-counter" },
    },
  };
}

export default function Page() {
  return <Client />;
}
