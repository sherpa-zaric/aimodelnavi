import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { setRequestLocale } from "next-intl/server";
import { CommentSection } from '@/components/comments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

export function generateStaticParams() {
  const jaPosts = getAllPosts("ja");
  const enPosts = getAllPosts("en");
  const params: { slug: string; locale: string }[] = [];
  for (const p of jaPosts) params.push({ slug: p.slug, locale: "ja" });
  for (const p of enPosts) params.push({ slug: p.slug, locale: "en" });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | AI Models Navi`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: [post.tag],
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/blog/${post.slug}`,
      languages: {
        ja: `https://aimodelsnavi.com/blog/${post.slug}`,
        en: `https://aimodelsnavi.com/en/blog/${post.slug}`,
        "x-default": `https://aimodelsnavi.com/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug, locale);

  if (!post) notFound();

  const baseUrl = locale === "en" ? "https://aimodelsnavi.com/en" : "https://aimodelsnavi.com";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "en" ? "Home" : "ホーム", item: "https://aimodelsnavi.com" },
      { "@type": "ListItem", position: 2, name: locale === "en" ? "Blog" : "ブログ", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "AI Models Navi",
      url: "https://aimodelsnavi.com",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Models Navi",
      url: "https://aimodelsnavi.com",
    },
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbLd, jsonLd]) }}
      />
      <Link
        href={`/${locale === "ja" ? "" : locale + "/"}blog`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        {locale === "en" ? "Back to Blog" : "ブログ一覧に戻る"}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
            {post.tag}
          </span>
          <time className="text-sm text-gray-400">{post.date}</time>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {post.title}
        </h1>
      </div>

      <div className="blog-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      <CommentSection slug={post.slug} title={post.title} />

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href={`/${locale === "ja" ? "" : locale + "/"}blog`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-3 h-3" />
          {locale === "en" ? "Back to Blog" : "ブログ一覧に戻る"}
        </Link>
      </div>
    </article>
  );
}
