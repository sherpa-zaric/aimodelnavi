import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ModelDetailPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/models"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        モデル一覧に戻る
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">モデル詳細</h1>
      <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500">
        モデル詳細ページはデータ連携後に動的生成されます。
      </div>
    </div>
  );
}
