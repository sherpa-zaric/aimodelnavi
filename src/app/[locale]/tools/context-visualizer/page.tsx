import type { Metadata } from "next";
import Client from "./client";

const META = {
  ja: { title: "コンテキストウィンドウ比較", desc: "AIモデルのコンテキストウィンドウサイズを視覚的に比較。" },
  en: { title: "AI Context Window Visualizer", desc: "Visually compare context window sizes across AI models." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale as keyof typeof META] || META.ja;
  return {
    title: m.title,
    description: m.desc,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/tools/context-visualizer`,
      languages: { ja: "https://aimodelsnavi.com/tools/context-visualizer", en: "https://aimodelsnavi.com/en/tools/context-visualizer", "x-default": "https://aimodelsnavi.com/tools/context-visualizer" },
    },
  };
}

export default function Page() {
  return <Client />;
}
