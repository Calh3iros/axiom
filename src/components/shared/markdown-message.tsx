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
 * Renders AI message text with full Markdown + LaTeX math support.
 *
 * Math delimiters supported:
 *   Inline:  $...$  or  \(...\)
 *   Block:   $$...$$  or  \[...\]
 *
 * Uses react-markdown + remark-math (parsing) + rehype-katex (rendering).
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-message leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
