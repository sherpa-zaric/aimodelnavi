import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIモデルランキング",
  description:
    "HLE、ARC-AGI-2、FrontierMath、SWE-bench Verified、τ²-Benchの統合ランキング。推論・基盤・コーディングモデル別に主要AIモデルのベンチマークスコアを比較。",
  openGraph: {
    title: "AIモデルランキング | AI Models Navi",
    description:
      "主要ベンチマークに基づくAIモデルの統合ランキング。HLE、ARC-AGI-2、SWE-benchなど。",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}