import type { Metadata } from "next";
import Link from "next/link";
import BlogList from "@/components/BlogList";

export const metadata: Metadata = {
  title: "ブログ",
  description: "AIモデルの最新ニュース、ベンチマーク分析、料金更新、技術解説。",
};

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ブログ</h1>
      <BlogList />
    </div>
  );
}
