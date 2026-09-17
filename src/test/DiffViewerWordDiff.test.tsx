import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileDiffViewer } from "../components/diff/FileDiffViewer";
import { InteractiveDiffViewer } from "../components/changes/InteractiveDiffViewer";
import { invokeCommand } from "../ipc/client";
import { useSettingsStore } from "../store/useSettingsStore";

describe("DiffViewer Word Diff and Ignore Whitespace Integration", () => {
  let queryClient: QueryClient;

  const sampleCommitDiff = {
    file_path: "src/example.ts",
    status: "modified",
    additions: 1,
    deletions: 1,
    hunks: [
      {
        header: "@@ -1,3 +1,3 @@",
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
        lines: [
          { line_type: "context", old_lineno: 1, new_lineno: 1, content: "const a = 1;\n" },
          { line_type: "delete", old_lineno: 2, new_lineno: null, content: "const b = 2;\n" },
          { line_type: "add", old_lineno: null, new_lineno: 2, content: "const b = 20;\n" },
          { line_type: "context", old_lineno: 3, new_lineno: 3, content: "export { a, b };\n" },
        ],
      },
    ],
  };

  const sampleWorkingDiff = {
    file_path: "src/sample.ts",
    status: "Modified",
    additions: 1,
    deletions: 1,
    hunks: [
      {
        header: "@@ -1,3 +1,3 @@",
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 3,
        lines: [
          { line_type: "context", old_lineno: 1, new_lineno: 1, content: "const a = 1;\n" },
          { line_type: "delete", old_lineno: 2, new_lineno: null, content: "const b = 2;\n" },
          { line_type: "add", old_lineno: null, new_lineno: 2, content: "const b = 20;\n" },
          { line_type: "context", old_lineno: 3, new_lineno: 3, content: "export { a, b };\n" },
        ],
      },
    ],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    useSettingsStore.setState({ diffIgnoreWhitespace: false });
  });

  describe("FileDiffViewer", () => {
    it("renders word diff highlights on modified lines", async () => {
      const getCommitDiffSpy = vi
        .spyOn(invokeCommand, "getCommitFileDiff")
        .mockResolvedValue(sampleCommitDiff);

      render(
        <QueryClientProvider client={queryClient}>
          <FileDiffViewer
            repoPath="/test/repo"
            commitId="commit-1"
            filePath="src/example.ts"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("src/example.ts")).toBeInTheDocument();
      });

      // Word diff spans should be present
      const highlightedRemoved = document.querySelectorAll(".text-diff-remove-text.bg-red-500\\/30");
      const highlightedAdded = document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30");

      expect(highlightedRemoved.length).toBeGreaterThan(0);
      expect(highlightedAdded.length).toBeGreaterThan(0);

      // Verify invokeCommand received ignoreWhitespace parameter
      expect(getCommitDiffSpy).toHaveBeenCalledWith("/test/repo", "commit-1", "src/example.ts", false);
    });

    it("renders Ignore Whitespace and Word Diff toolbar buttons and toggles them", async () => {
      vi.spyOn(invokeCommand, "getCommitFileDiff").mockResolvedValue(sampleCommitDiff);

      render(
        <QueryClientProvider client={queryClient}>
          <FileDiffViewer
            repoPath="/test/repo"
            commitId="commit-1"
            filePath="src/example.ts"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("src/example.ts")).toBeInTheDocument();
      });

      // Word Diff button initially on
      const wordDiffButton = screen.getByTitle(/word diff|tô màu chi tiết từ/i);
      expect(wordDiffButton).toBeInTheDocument();
      expect(document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30").length).toBeGreaterThan(0);

      // Clicking Word Diff toggles it off
      fireEvent.click(wordDiffButton);
      expect(document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30").length).toBe(0);

      // Clicking Word Diff toggles it back on
      fireEvent.click(wordDiffButton);
      expect(document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30").length).toBeGreaterThan(0);

      // Ignore Whitespace button
      const ignoreWsButton = screen.getByTitle(/khoảng trắng|whitespace/i);
      expect(ignoreWsButton).toBeInTheDocument();

      fireEvent.click(ignoreWsButton);
      expect(useSettingsStore.getState().diffIgnoreWhitespace).toBe(true);

      await waitFor(() => {
        expect(screen.getByText("src/example.ts")).toBeInTheDocument();
      });
    });
  });

  describe("InteractiveDiffViewer", () => {
    const mockOnStageHunk = vi.fn();
    const mockOnUnstageHunk = vi.fn();
    const mockOnStageLines = vi.fn();
    const mockOnUnstageLines = vi.fn();

    it("renders word diff highlights and toolbar buttons while preserving staging actions", async () => {
      const getWorkingDiffSpy = vi
        .spyOn(invokeCommand, "getWorkingFileDiff")
        .mockResolvedValue(sampleWorkingDiff);

      render(
        <QueryClientProvider client={queryClient}>
          <InteractiveDiffViewer
            repoPath="/test/repo"
            filePath="src/sample.ts"
            isStaged={false}
            onStageHunk={mockOnStageHunk}
            onUnstageHunk={mockOnUnstageHunk}
            onStageLines={mockOnStageLines}
            onUnstageLines={mockOnUnstageLines}
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("src/sample.ts")).toBeInTheDocument();
      });

      // Verify invokeCommand received ignoreWhitespace parameter
      expect(getWorkingDiffSpy).toHaveBeenCalledWith("/test/repo", "src/sample.ts", false, false);

      // Verify word diff tokens are highlighted
      const highlightedRemoved = document.querySelectorAll(".text-diff-remove-text.bg-red-500\\/30");
      const highlightedAdded = document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30");
      expect(highlightedRemoved.length).toBeGreaterThan(0);
      expect(highlightedAdded.length).toBeGreaterThan(0);

      // Verify Word Diff toggle button
      const wordDiffButton = screen.getByTitle(/word diff|tô màu chi tiết từ/i);
      expect(wordDiffButton).toBeInTheDocument();
      fireEvent.click(wordDiffButton);
      expect(document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30").length).toBe(0);
      fireEvent.click(wordDiffButton);
      expect(document.querySelectorAll(".text-diff-add-text.bg-emerald-500\\/30").length).toBeGreaterThan(0);

      // Verify Stage Hunk button works
      const stageHunkBtn = screen.getByTestId("stage-hunk-0");
      expect(stageHunkBtn).toBeInTheDocument();
      fireEvent.click(stageHunkBtn);
      expect(mockOnStageHunk).toHaveBeenCalledWith(0);

      // Verify Stage Line button works
      const stageLineBtn = screen.getByTestId("stage-line-0-1");
      expect(stageLineBtn).toBeInTheDocument();
      fireEvent.click(stageLineBtn);
      expect(mockOnStageLines).toHaveBeenCalledWith(0, [1]);

      // Verify Ignore Whitespace toggle button
      const ignoreWsButton = screen.getByTitle(/khoảng trắng|whitespace/i);
      expect(ignoreWsButton).toBeInTheDocument();
      fireEvent.click(ignoreWsButton);
      expect(useSettingsStore.getState().diffIgnoreWhitespace).toBe(true);

      await waitFor(() => {
        expect(screen.getByText("src/sample.ts")).toBeInTheDocument();
      });
    });
  });
});
