import { setRequestLocale } from "next-intl/server";
import blogManifest from "@/data/blog-manifest.json";
import blogManifestEn from "@/data/blog-manifest-en.json";
import type { Metadata } from "next";
import BlogListClient from "@/components/BlogListClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Blog" : "ブログ",
    description: isEn
      ? "Latest AI model news, benchmark analysis, pricing updates, and technical commentary."
      : "AIモデルの最新ニュース、ベンチマーク分析、料金更新、技術解説。",
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/blog`,
      languages: {
        ja: "https://aimodelsnavi.com/blog",
        en: "https://aimodelsnavi.com/en/blog",
        "x-default": "https://aimodelsnavi.com/blog",
      },
    },
  };
}

const jaLabels = {
  searchPlaceholder: "記事を検索...",
  all: "すべて",
  previous: "前へ",
  next: "次へ",
  noResults: "該当する記事が見つかりません",
  page: "ページ",
};

const enLabels = {
  searchPlaceholder: "Search articles...",
  all: "All",
  previous: "Previous",
  next: "Next",
  noResults: "No articles found",
  page: "page",
};

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEn = locale === "en";
  const manifest = isEn ? blogManifestEn : blogManifest;
  const sorted = [...manifest].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEn ? "Blog" : "ブログ"}
      </h1>
      <BlogListClient
        posts={sorted}
        locale={locale}
        labels={isEn ? enLabels : jaLabels}
      />
    </div>
  );
}
