import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">ランキング</h3>
            <ul className="space-y-2">
              <li><Link href="/leaderboard" className="text-sm text-gray-600 hover:text-primary-600">AIモデルランキング</Link></li>
              <li><Link href="/leaderboard?filter=reasoning" className="text-sm text-gray-600 hover:text-primary-600">推論モデル</Link></li>
              <li><Link href="/leaderboard?filter=coding" className="text-sm text-gray-600 hover:text-primary-600">プログラミング</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">料金</h3>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-primary-600">API料金比較</Link></li>
              <li><Link href="/tools/cost-calculator" className="text-sm text-gray-600 hover:text-primary-600">コスト計算</Link></li>
              <li><Link href="/tools/token-counter" className="text-sm text-gray-600 hover:text-primary-600">トークンカウンター</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">モデル</h3>
            <ul className="space-y-2">
              <li><Link href="/models" className="text-sm text-gray-600 hover:text-primary-600">モデル一覧</Link></li>
              <li><Link href="/models?source=open" className="text-sm text-gray-600 hover:text-primary-600">オープンソースモデル</Link></li>
              <li><Link href="/tools/model-compare" className="text-sm text-gray-600 hover:text-primary-600">モデル比較</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">情報</h3>
            <ul className="space-y-2">
              <li><Link href="/blog" className="text-sm text-gray-600 hover:text-primary-600">ブログ</Link></li>
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-primary-600">当サイトについて</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            AIモデルナビ — AIモデルの比較・料金・ランキング情報を提供する日本語プラットフォーム
          </p>
          <p className="text-xs text-gray-400 mt-1">
            掲載データは各社公式情報および公開ベンチマークに基づきます。最新の正確な情報は各公式サイトをご確認ください。
          </p>
        </div>
      </div>
    </footer>
  );
}
