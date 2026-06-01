"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { modelDetails } from "@/data/models";

// Build a regex that matches model names (longest first to avoid partial matches)
const sortedNames = [...modelDetails]
  .map((m) => m.name)
  .sort((a, b) => b.length - a.length);

const MODEL_PATTERN = new RegExp(
  `\\b(${sortedNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "g"
);

// Replace model names with markdown links in content string
export function addModelLinks(content: string, locale: string): string {
  const prefix = locale === "ja" ? "" : `/${locale}`;
  return content.replace(MODEL_PATTERN, (match) => {
    const model = modelDetails.find((m) => m.name === match);
    if (!model) return match;
    // Don't link if already inside a markdown link or heading anchor
    return `[${match}](${prefix}/models/${model.slug})`;
  });
}

interface Props {
  content: string;
  locale: string;
  className?: string;
}

export default function ModelLinkMarkdown({ content, locale, className }: Props) {
  const linkedContent = addModelLinks(content, locale);
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{linkedContent}</ReactMarkdown>
    </div>
  );
}
