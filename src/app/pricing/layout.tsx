import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API料金比較",
  description:
    "OpenAI、Anthropic、Google DeepMind、DeepSeek、xAIなど主要プロバイダーのAPI料金を1Mトークンあたりで比較。標準・バッチ・キャッシュ各モードの料金一覧。",
  openGraph: {
    title: "API料金比較 | AI Models Navi",
    description:
      "主要AIプロバイダーのAPI料金を1Mトークン単位で比較。標準・バッチ・キャッシュモード対応。",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}