/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

import { exportAsPDF } from "./export-utils";

// Mock jsPDF as a class constructor
vi.mock("jspdf", () => {
  return {
    jsPDF: class {
      internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
      setFontSize = vi.fn();
      setFont = vi.fn();
      setTextColor = vi.fn();
      setDrawColor = vi.fn();
      text = vi.fn();
      line = vi.fn();
      splitTextToSize = vi.fn((text: string) => text.split("\n"));
      addPage = vi.fn();
      setPage = vi.fn();
      getNumberOfPages = vi.fn(() => 1);
      save = vi.fn();
    },
  };
});

describe("exportAsPDF", () => {
  it("should not throw with valid text", () => {
    expect(() => exportAsPDF("Hello World")).not.toThrow();
  });

  it("should not throw with empty text", () => {
    expect(() => exportAsPDF("")).not.toThrow();
  });

  it("should accept custom filename", () => {
    expect(() => exportAsPDF("test", "my-file")).not.toThrow();
  });

  it("should handle multiline text", () => {
    const text = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    expect(() => exportAsPDF(text)).not.toThrow();
  });

  it("should handle very long text without crashing", () => {
    const longText = "A".repeat(10000);
    expect(() => exportAsPDF(longText)).not.toThrow();
  });
});
