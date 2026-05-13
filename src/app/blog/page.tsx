'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';

const ITEMS_PER_PAGE = 10;

export default function BlogListPage() {
  const [page, setPage] = useState(1);
  const posts = useMemo(() => getAllPosts(), []);

  const totalPages = Math.max(1, Math.ceil(posts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const displayPosts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return posts.slice(start, start + ITEMS_PER_PAGE);
  }, [posts, safePage]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
        <p className="mt-2 text-sm text-gray-500">
          AIモデルの最新情報、ベンチマーク分析、料金比較、チュートリアルをお届けします。
          <span className="ml-2 text-gray-400">({posts.length} 記事)</span>
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 bg-gray-50 rounded-xl text-center text-gray-500">
          まだ記事がありません。
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {displayPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-5 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                    {post.tag}
                  </span>
                  <time className="text-xs text-gray-400">{post.date}</time>
                </div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="mt-3 flex items-center text-xs font-medium text-primary-600">
                  続きを読む
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-gray-300 text-xs">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                        safePage === item
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
