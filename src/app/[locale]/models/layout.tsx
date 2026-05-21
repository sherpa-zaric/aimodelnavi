import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIモデル一覧",
  description:
    "OpenAI、Anthropic、Google、DeepSeekなど250以上のAIモデルをパラメータ数、コンテキスト長、ライセンスで比較。オープンソースモデルや日本国産モデルも網羅。",
  openGraph: {
    title: "AIモデル一覧 | AI Models Navi",
    description:
      "250以上のAIモデルの仕様・ライセンス・性能概要を一覧で比較。",
  },
};

export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}