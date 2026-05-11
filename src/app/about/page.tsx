export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">当サイトについて</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-bold text-gray-900">AIモデルナビとは</h2>
          <p className="text-gray-600 leading-relaxed">
            AIモデルナビは、最新のAIモデル（大規模言語モデル）に関する情報を日本語で提供するプラットフォームです。
            ベンチマーク比較、API料金比較、モデル仕様情報を一元化し、開発者や企業が最適なAIモデルを選定するための意思決定をサポートします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">提供する情報</h2>
          <ul className="text-gray-600 leading-relaxed space-y-2">
            <li><strong>AIモデルランキング</strong>：HLE、ARC-AGI-2、SWE-bench Verifiedなど主要ベンチマークに基づくモデルランキング</li>
            <li><strong>API料金比較</strong>：OpenAI、Anthropic、Google、DeepSeekなど主要プロバイダーのAPI料金を1Mトークンあたりで比較</li>
            <li><strong>モデル一覧</strong>：各モデルのパラメータ数、コンテキスト長、ライセンス、性能概要</li>
            <li><strong>コスト計算ツール</strong>：使用量に基づく月額APIコストの試算</li>
            <li><strong>ブログ</strong>：AIモデルの最新ニュース、ベンチマーク分析、技術解説</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">データについて</h2>
          <p className="text-gray-600 leading-relaxed">
            当サイトのデータは、以下の優先順位で収集しています：
          </p>
          <ol className="text-gray-600 leading-relaxed space-y-1 list-decimal pl-5">
            <li>各モデルの公式GitHubリポジトリ、Hugging Faceモデルカード、製品ページ、学術論文</li>
            <li>標準ベンチマーク（MMLU、GSM8K、HumanEval）およびコミュニティリーダーボード（LMSYS Chatbot Arena、Open LLM Leaderboard）</li>
            <li>独立した第三者評価機関（Artificial Analysis等）のデータ</li>
          </ol>
          <p className="text-gray-600 leading-relaxed mt-3">
            データは定期的に更新していますが、最新の正確な情報は各公式サイトでご確認ください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">お問い合わせ</h2>
          <p className="text-gray-600 leading-relaxed">
            当サイトに関するご意見・ご要望がございましたら、以下のメールアドレスまでお気軽にお寄せください。
          </p>
          <p className="text-primary-600 font-medium">
            contact@aimodelnavi.jp
          </p>
        </section>
      </div>
    </div>
  );
}
