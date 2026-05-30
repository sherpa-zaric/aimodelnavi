"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Plus, Trash2, Eye, EyeOff, X, Save } from "lucide-react";

interface Ad {
  id: number;
  name: string;
  position: string;
  ad_code: string;
  width: number | null;
  height: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const POSITIONS = [
  { value: "sidebar", label: "サイドバー", size: "160x600" },
  { value: "header-banner", label: "ヘッダーバナー", size: "728x90" },
  { value: "blog-inline", label: "ブログ内挿入", size: "300x250" },
  { value: "blog-bottom", label: "ブログ下部", size: "728x90" },
  { value: "model-inline", label: "モデル詳細内", size: "300x250" },
  { value: "footer-banner", label: "フッターバナー", size: "728x90" },
  { value: "mobile-banner", label: "モバイル固定", size: "320x50" },
];

const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.value, `${p.label} (${p.size})`])
);

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "sidebar",
    ad_code: "",
    width: "",
    height: "",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      setError("広告の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", position: "sidebar", ad_code: "", width: "", height: "", enabled: true });
    setShowForm(true);
  }

  function openEdit(ad: Ad) {
    setEditing(ad);
    setForm({
      name: ad.name,
      position: ad.position,
      ad_code: ad.ad_code,
      width: ad.width?.toString() || "",
      height: ad.height?.toString() || "",
      enabled: ad.enabled,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.ad_code) {
      setError("名前と広告コードは必須です");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name,
        position: form.position,
        ad_code: form.ad_code,
        width: form.width ? parseInt(form.width) : null,
        height: form.height ? parseInt(form.height) : null,
        enabled: form.enabled,
      };
      if (editing) {
        await fetch(`/api/admin/ads/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      fetchAds();
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("この広告を削除しますか？")) return;
    try {
      await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
      fetchAds();
    } catch {
      setError("削除に失敗しました");
    }
  }

  async function handleToggle(ad: Ad) {
    try {
      await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !ad.enabled }),
      });
      fetchAds();
    } catch {
      setError("更新に失敗しました");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">広告管理</h1>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {ads.length} 件
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              {editing ? "広告を編集" : "新規広告"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名前 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="例: サイドバー広告"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ポジション *</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.size})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">幅 (px)</label>
              <input
                type="number"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="自動"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">高さ (px)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="自動"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">広告コード *</label>
            <textarea
              value={form.ad_code}
              onChange={(e) => setForm({ ...form, ad_code: e.target.value })}
              rows={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder='<script>atOptions = { "key": "...", "format": "iframe", ... };</script><script src="https://example.com/invoke.js"></script>'
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              有効
            </label>
            <div className="flex-1" />
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm bg-primary-600 text-white px-4 py-1.5 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-gray-400">広告がありません。「新規作成」で追加してください。</p>
      ) : (
        <div className="space-y-2">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">{ad.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {POSITION_LABELS[ad.position] || ad.position}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ad.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {ad.enabled ? "有効" : "無効"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate font-mono">
                  {ad.ad_code.slice(0, 120)}...
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggle(ad)}
                  title={ad.enabled ? "無効にする" : "有効にする"}
                  className={`p-1.5 rounded transition-colors ${
                    ad.enabled
                      ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {ad.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(ad)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  <Megaphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
