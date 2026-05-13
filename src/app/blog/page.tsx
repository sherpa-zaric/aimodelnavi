import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "AIモデルの最新ニュース、ベンチマーク分析、API料金比較、チュートリアルなど日本語のAI技術記事をお届けします。",
  openGraph: {
    title: "ブログ | AI Models Navi",
    description:
      "AIモデルの最新情報、ベンチマーク分析、料金比較に関する日本語ブログ。",
  },
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
        <p className="mt-2 text-gray-500">
          AIモデルの最新情報、ベンチマーク分析、料金比較、チュートリアルをお届けします。
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 bg-gray-50 rounded-xl text-center text-gray-500">
          まだ記事がありません。
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card group block p-6 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {post.tag}
                </span>
                <time className="text-xs text-gray-400">{post.date}</time>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-snug transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center text-xs font-medium text-primary-600">
                続きを読む
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
