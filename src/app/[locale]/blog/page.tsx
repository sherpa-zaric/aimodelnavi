import type { Metadata } from "next";
import Link from "next/link";
import jaManifest from "@/data/blog-manifest.json";
import enManifest from "@/data/blog-manifest-en.json";

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

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const manifest = isEn ? enManifest : jaManifest;
  const sorted = [...manifest].sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEn ? "Blog" : "ブログ"}
      </h1>
      <div className="space-y-6">
        {sorted.map((post) => (
          <Link
            key={post.slug}
            href={`${isEn ? "/en" : ""}/blog/${post.slug}`}
            className="block p-4 sm:p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                {post.tag}
              </span>
              <time className="text-sm text-gray-400">{post.date}</time>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 line-clamp-2">
              {post.excerpt || ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
