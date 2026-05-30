"use client";

import { useState, useEffect } from "react";
import { Trash2, ExternalLink, Search } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tag: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(slug: string, title: string) {
    if (!confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(slug);
    setError("");

    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
      } else {
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Blog Management</h1>
        <span className="text-sm text-gray-400">{posts.length} posts</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or slug"
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No articles found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <div
              key={post.slug}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{post.date}</span>
                  {post.tag && (
                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {post.tag}
                    </span>
                  )}
                  <span className="text-xs text-gray-300 font-mono">
                    {post.slug}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-primary-600 rounded transition-colors"
                  title="Preview"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => deletePost(post.slug, post.title)}
                  disabled={deleting === post.slug}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
