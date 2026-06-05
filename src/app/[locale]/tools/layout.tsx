import type { Metadata } from "next";

const META: Record<string, { title: string; description: string; ogTitle: string; ogDesc: string }> = {
  ja: {
    title: "ツール",
    description: "AIモデル選定のための無料ツール：コスト計算機、モデル比較、トークンカウンター＆プロンプトコスト計算機。",
    ogTitle: "ツール | AI Models Navi",
    ogDesc: "AIモデル選定のための無料ツール：コスト計算機、モデル比較、トークンカウンター＆プロンプトコスト計算機。",
  },
  en: {
    title: "Tools",
    description: "Free tools for AI model selection: cost calculator, model comparison, and token counter & prompt cost calculator.",
    ogTitle: "Tools | AI Models Navi",
    ogDesc: "Free tools for AI model selection: cost calculator, model comparison, and token counter & prompt cost calculator.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] || META.ja;
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.ogTitle, description: m.ogDesc },
  };
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
