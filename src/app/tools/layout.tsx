import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ツール",
  description:
    "APIコスト計算、モデル比較、トークンカウンターなどAIモデル選定を支援する無料ツール集。",
  openGraph: {
    title: "ツール | AI Models Navi",
    description:
      "AIモデル選定を支援する無料ツール：コスト計算、モデル比較、トークンカウンター。",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}