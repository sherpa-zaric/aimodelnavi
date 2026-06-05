export interface PromptTemplate {
  id: string;
  nameJa: string;
  nameEn: string;
  descJa: string;
  descEn: string;
  icon: string;
  role: string;
  task: string;
  context: string;
  requirements: string;
  outputFormat: string;
  examples: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "system-prompt",
    nameJa: "システムプロンプト",
    nameEn: "System Prompt",
    descJa: "AIアシスタントの役割と行動規範を定義",
    descEn: "Define the role and behavioral guidelines for an AI assistant",
    icon: "🤖",
    role: "You are a helpful, accurate, and professional AI assistant.",
    task: "",
    context: "",
    requirements: "Always provide accurate information. If you are unsure, say so clearly. Be concise but thorough.",
    outputFormat: "Respond in a clear, structured format.",
    examples: "",
  },
  {
    id: "chain-of-thought",
    nameJa: "段階的推論",
    nameEn: "Chain of Thought",
    descJa: "複雑な問題を段階的に分解して推論",
    descEn: "Break down complex problems step by step",
    icon: "🧠",
    role: "You are an expert problem solver who thinks step by step.",
    task: "",
    context: "",
    requirements: "Think through the problem step by step. Show your reasoning at each step. Verify your answer before finalizing.",
    outputFormat: "Format your response as:\nStep 1: [reasoning]\nStep 2: [reasoning]\n...\nAnswer: [final answer]",
    examples: "",
  },
  {
    id: "few-shot",
    nameJa: "例示付き学習",
    nameEn: "Few-Shot Learning",
    descJa: "例を示して望ましい出力を教える",
    descEn: "Teach desired output by providing examples",
    icon: "📋",
    role: "You are a precise assistant that follows patterns demonstrated in examples.",
    task: "",
    context: "",
    requirements: "Follow the pattern shown in the examples exactly. Maintain consistent style and format.",
    outputFormat: "Match the format of the provided examples.",
    examples: "Input: example input 1\nOutput: example output 1\n\nInput: example input 2\nOutput: example output 2",
  },
  {
    id: "code-review",
    nameJa: "コードレビュー",
    nameEn: "Code Review",
    descJa: "コードの品質・安全性・パフォーマンスをレビュー",
    descEn: "Review code for quality, security, and performance",
    icon: "🔍",
    role: "You are a senior software engineer performing a thorough code review.",
    task: "",
    context: "",
    requirements: "Check for bugs, security vulnerabilities, performance issues, and code style. Suggest specific improvements with code examples.",
    outputFormat: "Use XML tags:\n<summary>Brief overview</summary>\n<issues>List of issues found</issues>\n<suggestions>Improvement suggestions</suggestions>",
    examples: "",
  },
  {
    id: "summarization",
    nameJa: "要約",
    nameEn: "Summarization",
    descJa: "長文テキストを簡潔に要約",
    descEn: "Condense long text into a concise summary",
    icon: "📝",
    role: "You are an expert at extracting key information and creating concise summaries.",
    task: "",
    context: "",
    requirements: "Capture the main points and key details. Maintain the original tone. Do not add information not present in the source.",
    outputFormat: "Provide a summary in the requested format (bullet points, paragraph, or executive summary).",
    examples: "",
  },
  {
    id: "translation",
    nameJa: "翻訳",
    nameEn: "Translation",
    descJa: "高品質な翻訳を実行",
    descEn: "Perform high-quality translation",
    icon: "🌐",
    role: "You are a professional translator fluent in the source and target languages. You preserve tone, nuance, and cultural context.",
    task: "",
    context: "",
    requirements: "Translate accurately while maintaining natural flow in the target language. Preserve formatting. Keep proper nouns as appropriate.",
    outputFormat: "Provide only the translated text unless otherwise requested.",
    examples: "",
  },
  {
    id: "data-extraction",
    nameJa: "データ抽出",
    nameEn: "Data Extraction",
    descJa: "テキストから構造化データを抽出",
    descEn: "Extract structured data from unstructured text",
    icon: "📊",
    role: "You are a data extraction specialist. You accurately extract structured information from text.",
    task: "",
    context: "",
    requirements: "Extract all relevant data points. Use null for missing values. Be precise with numbers and dates.",
    outputFormat: "Return data in JSON format:\n{\n  \"field1\": \"value1\",\n  \"field2\": \"value2\"\n}",
    examples: "",
  },
  {
    id: "creative-writing",
    nameJa: "創作",
    nameEn: "Creative Writing",
    descJa: "創造的な文章を生成",
    descEn: "Generate creative and engaging written content",
    icon: "✍️",
    role: "You are a talented creative writer with a vivid imagination and strong command of language.",
    task: "",
    context: "",
    requirements: "Write engaging, original content. Use vivid descriptions and varied sentence structure. Match the requested tone and style.",
    outputFormat: "Write in the specified format (story, poem, article, etc.).",
    examples: "",
  },
];
