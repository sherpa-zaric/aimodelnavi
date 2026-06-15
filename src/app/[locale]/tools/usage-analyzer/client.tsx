"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Upload, FileText, TrendingDown, AlertTriangle, CheckCircle, BarChart3, DollarSign, Zap } from "lucide-react";

const T = {
  ja: {
    back: "ツール一覧に戻る", title: "使用パターン分析", subtitle: "API使用ログを貼り付けて、コスト最適化の提案を受けましょう",
    pasteLog: "使用ログを貼り付け", placeholder: "ここにAPI使用ログを貼り付けてください...\n\n対応フォーマット:\n\n① Model: GPT-5.5, Tokens: 150000, Cost: $0.38\n② GPT-5.5 | 150000 | $0.38\n③ GPT-5.5\t150000\t0.38\n④ {\"model\": \"GPT-5.5\", \"tokens\": 150000, \"cost\": 0.38}",
    analyze: "分析する", analyzing: "分析中...",
    results: "分析結果", totalCost: "総コスト", totalRequests: "総リクエスト数", avgCostPerReq: "平均コスト/リクエスト",
    recommendations: "最適化提案", priority: "優先度", high: "高", medium: "中", low: "低",
    modelBreakdown: "モデル別内訳", usage: "使用量", cost: "コスト", percentage: "割合",
    tip1: "高コストモデルの使用頻度を下げると、大幅に節約できます", tip2: "バッチ処理を活用すると、リクエスト数を削減できます", tip3: "プロンプトキャッシュを活用すると、繰り返しリクエストのコストを削減できます",
    noData: "ログを貼り付けて分析ボタンをクリックしてください",
    error: "ログの解析に失敗しました。正しい形式で貼り付けてください。",
    proBadge: "Pro", comingSoon: "近日公開", saveUpTo: "最大節約額",
  },
  en: {
    back: "Back to Tools", title: "Usage Pattern Analyzer", subtitle: "Paste your API usage logs to get cost optimization recommendations",
    pasteLog: "Paste Usage Log", placeholder: "Paste your API usage logs here...\n\nSupported formats:\n\n① Model: GPT-5.5, Tokens: 150000, Cost: $0.38\n② GPT-5.5 | 150000 | $0.38\n③ GPT-5.5\t150000\t0.38\n④ {\"model\": \"GPT-5.5\", \"tokens\": 150000, \"cost\": 0.38}",
    analyze: "Analyze", analyzing: "Analyzing...",
    results: "Analysis Results", totalCost: "Total Cost", totalRequests: "Total Requests", avgCostPerReq: "Avg Cost/Request",
    recommendations: "Optimization Recommendations", priority: "Priority", high: "High", medium: "Medium", low: "Low",
    modelBreakdown: "Model Breakdown", usage: "Usage", cost: "Cost", percentage: "Percentage",
    tip1: "Reducing usage of expensive models can significantly cut costs", tip2: "Using batch processing can reduce the number of requests", tip3: "Leveraging prompt caching can reduce costs for repeated requests",
    noData: "Paste your logs and click Analyze to get started",
    error: "Failed to parse logs. Please check the format.",
    proBadge: "Pro", comingSoon: "Coming Soon", saveUpTo: "Save up to",
  },
};

interface LogEntry {
  model: string;
  tokens: number;
  cost: number;
}

interface AnalysisResult {
  totalCost: number;
  totalRequests: number;
  avgCostPerReq: number;
  modelBreakdown: { model: string; tokens: number; cost: number; percentage: number }[];
  recommendations: { priority: string; title: string; description: string; savings: number }[];
}

function parseLogs(text: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    // Try multiple formats
    let modelMatch, tokensMatch, costMatch;

    // Format 1: Model: GPT-5.5, Tokens: 150000, Cost: $0.38
    modelMatch = line.match(/Model:\s*([^,]+)/i);
    tokensMatch = line.match(/Tokens:\s*(\d+)/i);
    costMatch = line.match(/Cost:\s*\$?([\d.]+)/i);

    // Format 2: GPT-5.5 | 150000 tokens | $0.38
    if (!modelMatch) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        modelMatch = [line, parts[0]];
        tokensMatch = [line, parts[1].replace(/\D/g, "")];
        costMatch = [line, parts[2].replace(/[^0-9.]/g, "")];
      }
    }

    // Format 3: GPT-5.5 150000 $0.38 (tab or multi-space separated)
    if (!modelMatch) {
      const parts = line.split(/\t+|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const maybeTokens = parts[1].replace(/\D/g, "");
        const maybeCost = parts[2].replace(/[^0-9.]/g, "");
        if (maybeTokens && maybeCost) {
          modelMatch = [line, parts[0]];
          tokensMatch = [line, maybeTokens];
          costMatch = [line, maybeCost];
        }
      }
    }

    // Format 4: JSON line {"model": "GPT-5.5", "tokens": 150000, "cost": 0.38}
    if (!modelMatch && line.trim().startsWith("{")) {
      try {
        const json = JSON.parse(line);
        if (json.model && (json.tokens || json.input_tokens) && (json.cost || json.total_cost)) {
          entries.push({
            model: json.model,
            tokens: json.tokens || json.input_tokens || 0,
            cost: json.cost || json.total_cost || 0,
          });
          continue;
        }
      } catch {}
    }

    if (modelMatch && tokensMatch && costMatch) {
      const tokens = parseInt(tokensMatch[1]);
      const cost = parseFloat(costMatch[1]);
      if (!isNaN(tokens) && !isNaN(cost) && tokens > 0 && cost >= 0) {
        entries.push({
          model: modelMatch[1].trim(),
          tokens,
          cost,
        });
      }
    }
  }

  return entries;
}

function analyzeLogs(entries: LogEntry[]): AnalysisResult {
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const totalRequests = entries.length;
  const avgCostPerReq = totalCost / totalRequests;

  // Model breakdown
  const modelMap = new Map<string, { tokens: number; cost: number }>();
  for (const entry of entries) {
    const existing = modelMap.get(entry.model) || { tokens: 0, cost: 0 };
    modelMap.set(entry.model, {
      tokens: existing.tokens + entry.tokens,
      cost: existing.cost + entry.cost,
    });
  }

  const modelBreakdown = Array.from(modelMap.entries())
    .map(([model, data]) => ({
      model,
      tokens: data.tokens,
      cost: data.cost,
      percentage: (data.cost / totalCost) * 100,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Generate recommendations
  const recommendations: AnalysisResult["recommendations"] = [];

  // Check for expensive models
  const expensiveModels = modelBreakdown.filter((m) => m.percentage > 30 && m.cost / (entries.filter((e) => e.model === m.model).length) > 1);
  if (expensiveModels.length > 0) {
    const savings = expensiveModels.reduce((sum, m) => sum + m.cost * 0.5, 0);
    recommendations.push({
      priority: "high",
      title: "高コストモデルの使用を最適化",
      description: `${expensiveModels.map((m) => m.model).join(", ")}の使用頻度が高く、コストの大半を占めています。より安価な代替モデルの検討を推奨します。`,
      savings,
    });
  }

  // Check for high token usage
  const highTokenModels = modelBreakdown.filter((m) => m.tokens > 500000);
  if (highTokenModels.length > 0) {
    recommendations.push({
      priority: "medium",
      title: "トークン使用量の最適化",
      description: "一部のモデルでトークン使用量が多すぎます。プロンプトの短縮やキャッシュの活用を検討してください。",
      savings: totalCost * 0.2,
    });
  }

  // General recommendations
  if (totalRequests > 100) {
    recommendations.push({
      priority: "medium",
      title: "バッチ処理の活用",
      description: "リクエスト数が多いため、バッチ処理を活用してコストを削減できます。",
      savings: totalCost * 0.15,
    });
  }

  return { totalCost, totalRequests, avgCostPerReq, modelBreakdown, recommendations };
}

export default function UsageAnalyzerPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];

  const [logText, setLogText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setError("");
    setResult(null);
    setAnalyzing(true);

    setTimeout(() => {
      try {
        const entries = parseLogs(logText);
        if (entries.length === 0) {
          setError(t.error);
          setAnalyzing(false);
          return;
        }
        const analysis = analyzeLogs(entries);
        setResult(analysis);
      } catch {
        setError(t.error);
      }
      setAnalyzing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale + "/"}tools`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-8">{t.subtitle}</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-gray-500" />
              <h2 className="font-bold text-gray-900">{t.pasteLog}</h2>
            </div>
            <textarea
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder={t.placeholder}
              className="w-full h-64 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAnalyze}
              disabled={!logText.trim() || analyzing}
              className="mt-4 w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? t.analyzing : t.analyze}
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-primary-50 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4 text-primary-600" />
                      <p className="text-xs font-medium text-primary-600">{t.totalCost}</p>
                    </div>
                    <p className="text-xl font-bold text-primary-700">${result.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-accent-50 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <BarChart3 className="w-4 h-4 text-accent-600" />
                      <p className="text-xs font-medium text-accent-600">{t.totalRequests}</p>
                    </div>
                    <p className="text-xl font-bold text-accent-700">{result.totalRequests}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs font-medium text-emerald-600">{t.avgCostPerReq}</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">${result.avgCostPerReq.toFixed(4)}</p>
                  </div>
                </div>

                {/* Model Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">{t.modelBreakdown}</h3>
                  <div className="space-y-3">
                    {result.modelBreakdown.map((m) => (
                      <div key={m.model} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{m.model}</span>
                            <span className="text-xs text-gray-500">${m.cost.toFixed(2)} ({m.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${m.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">{t.recommendations}</h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="p-4 bg-emerald-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              rec.priority === "high" ? "bg-red-100 text-red-700" :
                              rec.priority === "medium" ? "bg-amber-100 text-amber-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {rec.priority === "high" ? t.high : rec.priority === "medium" ? t.medium : t.low}
                            </span>
                            <span className="font-medium text-gray-900 text-sm">{rec.title}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-sm font-medium text-emerald-600">
                            {t.saveUpTo} ${rec.savings.toFixed(2)}/月
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText className="w-12 h-12 mb-4" />
                <p className="text-sm">{t.noData}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
