"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  title_en?: string;
  tag: string;
  excerpt?: string;
  excerpt_en?: string;
  date: string;
}

interface Props {
  posts: BlogPost[];
  locale: string;
  labels: {
    searchPlaceholder: string;
    all: string;
    previous: string;
    next: string;
    noResults: string;
    page: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function BlogListClient({ posts, locale, labels }: Props) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.get("tag")
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Sync with URL param changes (e.g., navigating from header dropdown)
  useEffect(() => {
    const tag = searchParams.get("tag");
    setSelectedTag(tag);
    setCurrentPage(1);
  }, [searchParams]);

  const isEn = locale === "en";

  // Extract unique tags preserving order by frequency
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      counts.set(post.tag, (counts.get(post.tag) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [posts]);

  // Filter posts
  const filtered = useMemo(() => {
    let result = posts;

    if (selectedTag) {
      result = result.filter((p) => p.tag === selectedTag);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) => {
        const title = (isEn ? p.title_en || p.title : p.title).toLowerCase();
        const excerpt = (isEn ? p.excerpt_en || p.excerpt || "" : p.excerpt || "").toLowerCase();
        return title.includes(q) || excerpt.includes(q);
      });
    }

    return result;
  }, [posts, selectedTag, search, isEn]);

  // Reset to page 1 when filters change
  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const blogBase = isEn ? "/en/blog" : "/blog";

  return (
    <>
      {/* Search box */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 transition-colors"
        />
        {search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleTagClick(null)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            selectedTag === null
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {labels.all}
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(selectedTag === tag ? null : tag)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedTag === tag
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results count when filtered */}
      {(selectedTag || search.trim()) && (
        <p className="text-xs text-gray-400 mb-4">
          {filtered.length} {isEn ? "results" : "件"}
        </p>
      )}

      {/* Post list */}
      <div className="space-y-6">
        {paged.length === 0 ? (
          <p className="text-center text-gray-400 py-12">{labels.noResults}</p>
        ) : (
          paged.map((post) => (
            <Link
              key={post.slug}
              href={`${blogBase}/${post.slug}`}
              className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {post.tag}
                </span>
                <time className="text-sm text-gray-400">{post.date}</time>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isEn ? post.title_en || post.title : post.title}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2">
                {isEn
                  ? post.excerpt_en || post.excerpt || ""
                  : post.excerpt || ""}
              </p>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
            >
              <ChevronLeft className="w-4 h-4" />
              {labels.previous}
            </button>
          )}
          <span className="text-sm text-gray-400">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              {labels.next}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
