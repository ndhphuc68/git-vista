import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  tokenize,
  computeWordDiff,
  pairHunkLines,
  WordDiffToken,
} from "../utils/wordDiff";
import { DiffLineContent } from "../components/diff/DiffLineContent";
import { DiffLine } from "../ipc/bindings";

describe("wordDiff tokenizer", () => {
  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("tokenizes whitespace and identifiers", () => {
    const tokens = tokenize("const a = 1;");
    expect(tokens).toEqual(["const", " ", "a", " ", "=", " ", "1", ";"]);
  });

  it("tokenizes Unicode characters and underscores", () => {
    const tokens = tokenize("const café_count = 42;");
    expect(tokens).toEqual(["const", " ", "café_count", " ", "=", " ", "42", ";"]);
  });

  it("tokenizes non-Latin scripts", () => {
    const tokens = tokenize("const 変数 = 'こんにちは';");
    expect(tokens).toEqual(["const", " ", "変数", " ", "=", " ", "'", "こんにちは", "'", ";"]);
  });

  it("tokenizes complex operators and punctuation", () => {
    const tokens = tokenize("x += (y - 3) * 4.5;");
    expect(tokens).toEqual([
      "x",
      " ",
      "+",
      "=",
      " ",
      "(",
      "y",
      " ",
      "-",
      " ",
      "3",
      ")",
      " ",
      "*",
      " ",
      "4",
      ".",
      "5",
      ";",
    ]);
  });
});

describe("computeWordDiff LCS algorithm", () => {
  it("detects identical lines with equal tokens", () => {
    const { oldTokens, newTokens } = computeWordDiff("const x = 1;", "const x = 1;");
    expect(oldTokens.every((t) => t.type === "equal")).toBe(true);
    expect(newTokens.every((t) => t.type === "equal")).toBe(true);
    expect(oldTokens.map((t) => t.text).join("")).toBe("const x = 1;");
    expect(newTokens.map((t) => t.text).join("")).toBe("const x = 1;");
  });

  it("detects single token modification", () => {
    const { oldTokens, newTokens } = computeWordDiff("const a = 1;", "const a = 2;");

    expect(oldTokens).toEqual([
      { text: "const", type: "equal" },
      { text: " ", type: "equal" },
      { text: "a", type: "equal" },
      { text: " ", type: "equal" },
      { text: "=", type: "equal" },
      { text: " ", type: "equal" },
      { text: "1", type: "removed" },
      { text: ";", type: "equal" },
    ]);

    expect(newTokens).toEqual([
      { text: "const", type: "equal" },
      { text: " ", type: "equal" },
      { text: "a", type: "equal" },
      { text: " ", type: "equal" },
      { text: "=", type: "equal" },
      { text: " ", type: "equal" },
      { text: "2", type: "added" },
      { text: ";", type: "equal" },
    ]);
  });

  it("handles multi-token insertions and deletions", () => {
    const { oldTokens, newTokens } = computeWordDiff("fn()", "fn(a, b)");

    const removedTokens = oldTokens.filter((t) => t.type === "removed");
    const addedTokens = newTokens.filter((t) => t.type === "added");

    expect(removedTokens).toHaveLength(0);
    expect(addedTokens.map((t) => t.text).join("")).toBe("a, b");
  });

  it("handles completely disjoint lines", () => {
    const { oldTokens, newTokens } = computeWordDiff("foo", "bar");

    expect(oldTokens.every((t) => t.type === "removed")).toBe(true);
    expect(newTokens.every((t) => t.type === "added")).toBe(true);
    expect(oldTokens.map((t) => t.text).join("")).toBe("foo");
    expect(newTokens.map((t) => t.text).join("")).toBe("bar");
  });

  it("handles replaced words with common whitespace", () => {
    const { oldTokens, newTokens } = computeWordDiff("foo bar", "baz qux");
    expect(oldTokens).toEqual([
      { text: "foo", type: "removed" },
      { text: " ", type: "equal" },
      { text: "bar", type: "removed" },
    ]);
    expect(newTokens).toEqual([
      { text: "baz", type: "added" },
      { text: " ", type: "equal" },
      { text: "qux", type: "added" },
    ]);
  });

  it("handles empty strings", () => {
    const fromEmpty = computeWordDiff("", "new text");
    expect(fromEmpty.oldTokens).toEqual([]);
    expect(fromEmpty.newTokens.every((t) => t.type === "added")).toBe(true);

    const toEmpty = computeWordDiff("old text", "");
    expect(toEmpty.oldTokens.every((t) => t.type === "removed")).toBe(true);
    expect(toEmpty.newTokens).toEqual([]);
  });
});

describe("pairHunkLines", () => {
  it("pairs consecutive delete and add lines 1:1", () => {
    const lines: DiffLine[] = [
      { line_type: "delete", content: "const a = 1;", old_lineno: 1, new_lineno: null },
      { line_type: "add", content: "const a = 2;", old_lineno: null, new_lineno: 1 },
    ];

    const tokenMap = pairHunkLines(lines);
    expect(tokenMap.has(0)).toBe(true);
    expect(tokenMap.has(1)).toBe(true);

    const oldTokens = tokenMap.get(0)!;
    const newTokens = tokenMap.get(1)!;

    expect(oldTokens.find((t) => t.type === "removed")?.text).toBe("1");
    expect(newTokens.find((t) => t.type === "added")?.text).toBe("2");
  });

  it("pairs multiple consecutive deletes and adds up to min(del.length, add.length)", () => {
    const lines: DiffLine[] = [
      { line_type: "delete", content: "del1", old_lineno: 1, new_lineno: null },
      { line_type: "delete", content: "del2", old_lineno: 2, new_lineno: null },
      { line_type: "delete", content: "del3", old_lineno: 3, new_lineno: null },
      { line_type: "add", content: "add1", old_lineno: null, new_lineno: 1 },
    ];

    const tokenMap = pairHunkLines(lines);
    expect(tokenMap.has(0)).toBe(true); // paired with add1
    expect(tokenMap.has(3)).toBe(true); // add1 paired with del1
    expect(tokenMap.has(1)).toBe(false); // del2 unpaired
    expect(tokenMap.has(2)).toBe(false); // del3 unpaired
  });

  it("leaves unpaired adds without entries when more adds than deletes", () => {
    const lines: DiffLine[] = [
      { line_type: "delete", content: "del1", old_lineno: 1, new_lineno: null },
      { line_type: "add", content: "add1", old_lineno: null, new_lineno: 1 },
      { line_type: "add", content: "add2", old_lineno: null, new_lineno: 2 },
    ];

    const tokenMap = pairHunkLines(lines);
    expect(tokenMap.has(0)).toBe(true);
    expect(tokenMap.has(1)).toBe(true);
    expect(tokenMap.has(2)).toBe(false);
  });

  it("does not pair pure adds or pure deletes without counter-parts", () => {
    const lines: DiffLine[] = [
      { line_type: "context", content: "ctx1", old_lineno: 1, new_lineno: 1 },
      { line_type: "add", content: "add1", old_lineno: null, new_lineno: 2 },
      { line_type: "context", content: "ctx2", old_lineno: 2, new_lineno: 3 },
      { line_type: "delete", content: "del1", old_lineno: 3, new_lineno: null },
      { line_type: "context", content: "ctx3", old_lineno: 4, new_lineno: 4 },
    ];

    const tokenMap = pairHunkLines(lines);
    expect(tokenMap.size).toBe(0);
  });
});

describe("DiffLineContent component", () => {
  it("renders plain content when showWordDiff is false", () => {
    const tokens: WordDiffToken[] = [
      { text: "const ", type: "equal" },
      { text: "a", type: "removed" },
    ];

    const { container } = render(
      React.createElement(DiffLineContent, {
        content: "const a",
        lineType: "delete",
        tokens,
        showWordDiff: false,
      })
    );

    expect(container.textContent).toBe("const a");
    expect(container.querySelector(".bg-red-500\\/30")).toBeNull();
  });

  it("renders plain content when tokens are not provided or empty", () => {
    const { container } = render(
      React.createElement(DiffLineContent, {
        content: "hello world",
        lineType: "context",
      })
    );
    expect(container.textContent).toBe("hello world");
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("renders highlighted spans for added and removed tokens", () => {
    const tokens: WordDiffToken[] = [
      { text: "const ", type: "equal" },
      { text: "oldVar", type: "removed" },
      { text: "newVar", type: "added" },
      { text: " = 42;", type: "equal" },
    ];

    const { container } = render(
      React.createElement(DiffLineContent, {
        content: "const oldVarnewVar = 42;",
        lineType: "delete",
        tokens,
        showWordDiff: true,
      })
    );

    const removed = container.querySelector(".bg-red-500\\/30");
    expect(removed).not.toBeNull();
    expect(removed?.textContent).toBe("oldVar");
    expect(removed?.className).toContain("text-diff-remove-text");
    expect(removed?.className).toContain("font-semibold");
    expect(removed?.className).toContain("rounded-xs");
    expect(removed?.className).toContain("px-0.5");

    const added = container.querySelector(".bg-emerald-500\\/30");
    expect(added).not.toBeNull();
    expect(added?.textContent).toBe("newVar");
    expect(added?.className).toContain("text-diff-add-text");
    expect(added?.className).toContain("font-semibold");
    expect(added?.className).toContain("rounded-xs");
    expect(added?.className).toContain("px-0.5");

    expect(container.textContent).toBe("const oldVarnewVar = 42;");
  });
});
