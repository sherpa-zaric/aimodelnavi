import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import blogManifest from "@/data/blog-manifest.json";
import blogManifestEn from "@/data/blog-manifest-en.json";
import type { Metadata } from "next";

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

const ITEMS_PER_PAGE = 10;

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  // Use English manifest for en locale
  const manifest = locale === "en" ? blogManifestEn : blogManifest;
  const sorted = [...manifest].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paged = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {locale === "en" ? "Blog" : "ブログ"}
      </h1>

      <div className="space-y-6">
        {paged.map((post: any) => (
          <Link
            key={post.slug}
            href={`/${locale === "ja" ? "" : locale + "/"}blog/${post.slug}`}
            className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                {post.tag}
              </span>
              <time className="text-sm text-gray-400">{post.date}</time>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === "en" ? (post.title_en || post.title) : post.title}
            </h2>
            <p className="text-sm text-gray-500 line-clamp-2">
              {locale === "en"
                ? (post.excerpt_en || post.excerpt || "")
                : (post.excerpt || "")}
            </p>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          {currentPage > 1 && (
            <Link
              href={`/${locale === "ja" ? "" : locale + "/"}blog?page=${currentPage - 1}`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
            >
              <ChevronLeft className="w-4 h-4" />
              {locale === "en" ? "Previous" : "前へ"}
            </Link>
          )}
          <span className="text-sm text-gray-400">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale === "ja" ? "" : locale + "/"}blog?page=${currentPage + 1}`}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              {locale === "en" ? "Next" : "次へ"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
