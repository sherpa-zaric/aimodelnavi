import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        ブログ一覧に戻る
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

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-3 h-3" />
          ブログ一覧に戻る
        </Link>
      </div>
    </article>
  );
}
