"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  topics: string[];
  date: string;
  title_en?: string;
  excerpt_en?: string;
}

const ITEMS_PER_PAGE = 10;

// Inline a small subset of manifest for initial render, then load full on client
const JA_POSTS: BlogPost[] = [
  { slug: "anthropic-fable-nerfing-2026", title: "AnthropicがFableを意図的に制限？", tag: "Anthropic", excerpt: "", topics: [], date: "2026-06-10" },
];

export default function BlogListPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const isEn = locale === "en";
  const [manifest, setManifest] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load manifest on mount
  useMemo(() => {
    if (loaded) return;
    const url = `/api/blog-manifest?locale=${locale}`;
    fetch(url).then(r => r.json()).then((data: BlogPost[]) => {
      setManifest(data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [isEn, loaded]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of manifest) {
      counts.set(post.tag, (counts.get(post.tag) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [manifest]);

  const filtered = useMemo(() => {
    let result = manifest;
    if (selectedTag) result = result.filter(p => p.tag === selectedTag);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const title = (isEn ? p.title_en || p.title : p.title).toLowerCase();
        const excerpt = (isEn ? p.excerpt_en || p.excerpt : p.excerpt || "").toLowerCase();
        return title.includes(q) || excerpt.includes(q);
      });
    }
    return result;
  }, [manifest, selectedTag, search, isEn]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [filtered]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paged = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const blogBase = isEn ? "/en/blog" : "/blog";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEn ? "Blog" : "ブログ"}
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder={isEn ? "Search articles..." : "記事を検索..."}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary-400"
        />
        {search && (
          <button onClick={() => { setSearch(""); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setSelectedTag(null); setCurrentPage(1); }}
          className={`px-3 py-1 text-xs font-medium rounded-full ${selectedTag === null ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          {isEn ? "All" : "すべて"}
        </button>
        {tags.map(tag => (
          <button key={tag} onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setCurrentPage(1); }}
            className={`px-3 py-1 text-xs font-medium rounded-full ${selectedTag === tag ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Posts */}
      {!loaded ? (
        <div className="py-12 text-center text-gray-400">{isEn ? "Loading..." : "読み込み中..."}</div>
      ) : paged.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{isEn ? "No articles found" : "該当する記事が見つかりません"}</p>
      ) : (
        <div className="space-y-6">
          {paged.map(post => (
            <Link key={post.slug} href={`${blogBase}/${post.slug}`}
              className="block p-4 sm:p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">{post.tag}</span>
                <time className="text-sm text-gray-400">{post.date}</time>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isEn ? post.title_en || post.title : post.title}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2">
                {isEn ? post.excerpt_en || post.excerpt || "" : post.excerpt || ""}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          {currentPage > 1 && (
            <button onClick={() => setCurrentPage(currentPage - 1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
              <ChevronLeft className="w-4 h-4" />{isEn ? "Previous" : "前へ"}
            </button>
          )}
          <span className="text-sm text-gray-400">{currentPage} / {totalPages}</span>
          {currentPage < totalPages && (
            <button onClick={() => setCurrentPage(currentPage + 1)} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              {isEn ? "Next" : "次へ"}<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
