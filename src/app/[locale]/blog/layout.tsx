import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "AIモデルの最新ニュース、ベンチマーク分析、API料金比較、チュートリアルなど日本語のAI技術記事をお届けします。",
  openGraph: {
    title: "ブログ | AI Models Navi",
    description:
      "AIモデルの最新情報、ベンチマーク分析、料金比較に関する日本語ブログ。",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://aimodelsnavi.com/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
