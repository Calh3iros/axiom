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
 * Handles common Gemini output patterns:
 *   1. Math in backticks without $ signs: `x^2 + 3x` → $x^2 + 3x$
 *   2. Backtick-wrapped $: `$x^2$` → $x^2$
 *   3. Escaped parens/brackets: \( ... \) → $ ... $
 *   4. Bold inside math delimiters: $**x**$ → $x$
 */
function preprocessLatex(text: string): string {
  let result = text;

  // 1. Strip backticks wrapping dollar-sign math: `$...$` → $...$  and  `$$...$$` → $$...$$
  result = result.replace(/`(\$\$[\s\S]*?\$\$)`/g, "$1");
  result = result.replace(/`(\$[^$\n]+?\$)`/g, "$1");

  // 2. Convert \(...\) → $...$  and  \[...\] → $$...$$
  result = result.replace(/\\\(([^)]*?)\\\)/g, "$$$1$$");
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$");

  // 3. AGGRESSIVE: Convert backtick math to LaTeX when content looks like math
  // Detects patterns like: `x^2`, `a + b = c`, `2x + 3`, `sqrt(x)`, `frac{a}{b}`, etc.
  result = result.replace(/`([^`\n]+)`/g, (match, inner: string) => {
    const trimmed = inner.trim();
    // Skip if already has $ delimiters, or is clearly code (has spaces at start, function calls, etc.)
    if (
      trimmed.startsWith("$") ||
      trimmed.includes("console.") ||
      trimmed.includes("import ") ||
      trimmed.includes("const ") ||
      trimmed.includes("function ")
    ) {
      return match;
    }
    // Detect math-like patterns
    const mathIndicators = [
      /[a-zA-Z]\^/, // x^2, a^n
      /[_^{}]/, // Subscript, superscript, braces
      /\\frac/, // LaTeX fractions
      /\\sqrt/, // Square root
      /\\pm/, // Plus-minus
      /[±√∑∫∞≠≤≥≈]/, // Math unicode symbols
      /\d+[a-zA-Z]/, // 2x, 3y (number followed by variable)
      /[a-zA-Z]\d/, // x2, y1 (variable followed by number — part of expression)
      /[+\-*/=<>]\s*\d/, // Operators with numbers
      /\d\s*[+\-*/=<>]/, // Numbers with operators
      /^[a-z]\s*=\s*/i, // x = ..., a = ...
      /\([^)]*[+\-*/^][^)]*\)/, // Parenthesized expressions with operators
    ];
    const isMath = mathIndicators.some((pattern) => pattern.test(trimmed));
    if (isMath) {
      return `$${trimmed}$`;
    }
    return match;
  });

  // 4. Remove ** bold markers that appear inside $ $ blocks
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
