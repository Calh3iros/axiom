"use client";

import "katex/dist/katex.min.css";
import "./markdown-message.css";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

interface MarkdownMessageProps {
  content: string;
}

/**
 * Preprocesses AI text to ensure LaTeX math renders correctly.
 * Handles common Gemini output patterns that break remark-math:
 *   1. Backtick-wrapped math: `$x^2$` → $x^2$
 *   2. Escaped parens/brackets: \( ... \) → $ ... $   and   \[ ... \] → $$ ... $$
 *   3. Double-escaped delimiters: \\$ → $
 */
function preprocessLatex(text: string): string {
  let result = text;

  // 1. Strip backticks wrapping dollar-sign math: `$...$` → $...$  and  `$$...$$` → $$...$$
  result = result.replace(/`(\$\$[\s\S]*?\$\$)`/g, "$1");
  result = result.replace(/`(\$[^$\n]+?\$)`/g, "$1");

  // 2. Convert \(...\) → $...$  and  \[...\] → $$...$$
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$");

  // 3. Normalize common Gemini artifacts: ** inside math, double backslashes
  // Remove ** bold markers that appear inside $ $ blocks (Gemini sometimes mixes markdown + latex)
  result = result.replace(/\$\*\*(.*?)\*\*\$/g, "$$$1$$");

  return result;
}

/**
 * Renders AI message text with full Markdown + LaTeX math support.
 *
 * Math delimiters supported:
 *   Inline:  $...$  or  \(...\)
 *   Block:   $$...$$  or  \[...\]
 *
 * Uses react-markdown + remark-math (parsing) + rehype-katex (rendering).
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const processed = preprocessLatex(content);
  return (
    <div className="markdown-message leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
