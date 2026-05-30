"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface AdminComment {
  id: number;
  slug: string;
  name: string;
  content: string;
  parent_id: number | null;
  status: string;
  created_at: string;
  ip_hash: string;
  parent_name: string | null;
  parent_content: string | null;
}

interface CommentsResponse {
  comments: AdminComment[];
  total: number;
  page: number;
  totalPages: number;
  counts: { all: number; pending: number; approved: number; rejected: number };
}

export default function AdminCommentsPage() {
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${statusFilter}&page=${page}`);
      if (res.ok) setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchComments();
  }

  async function deleteComment(id: number) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    fetchComments();
  }

  function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    if (diff < hour) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  }

  const counts = data?.counts || { all: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">Comment Management</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "approved", label: "Approved", count: counts.approved },
          { key: "rejected", label: "Rejected", count: counts.rejected },
          { key: "all", label: "All", count: counts.all },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === tab.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !data || data.comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments</p>
      ) : (
        <div className="space-y-3">
          {data.comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {comment.name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      comment.status === "approved"
                        ? "bg-green-50 text-green-700"
                        : comment.status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {comment.status === "approved" ? "Approved"
                        : comment.status === "rejected" ? "Rejected"
                        : "Pending"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {relativeTime(comment.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    {comment.content}
                  </p>

                  {comment.parent_name && (
                    <p className="text-xs text-gray-400 mb-2">
                      Reply to: {comment.parent_name} "{comment.parent_content?.slice(0, 50)}..."
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <a
                      href={`/blog/${comment.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary-600"
                    >
                      {comment.slug.slice(0, 40)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span>IP: {comment.ip_hash}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {comment.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(comment.id, "approved")}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {comment.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(comment.id, "rejected")}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
