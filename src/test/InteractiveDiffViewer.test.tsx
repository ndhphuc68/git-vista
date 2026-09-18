import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InteractiveDiffViewer } from "../components/changes/InteractiveDiffViewer";
import { invokeCommand } from "../ipc/client";

describe("InteractiveDiffViewer", () => {
  let queryClient: QueryClient;
  const mockOnStageHunk = vi.fn();
  const mockOnUnstageHunk = vi.fn();
  const mockOnStageLines = vi.fn();
  const mockOnUnstageLines = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const sampleDiff = {
    file_path: "src/sample.ts",
    status: "Modified",
    additions: 2,
    deletions: 1,
    hunks: [
      {
        header: "@@ -1,3 +1,4 @@",
        old_start: 1,
        old_lines: 3,
        new_start: 1,
        new_lines: 4,
        lines: [
          { line_type: "context", old_lineno: 1, new_lineno: 1, content: "const a = 1;\n" },
          { line_type: "delete", old_lineno: 2, new_lineno: null, content: "const b = 2;\n" },
          { line_type: "add", old_lineno: null, new_lineno: 2, content: "const b = 20;\n" },
          { line_type: "add", old_lineno: null, new_lineno: 3, content: "const c = 30;\n" },
          { line_type: "context", old_lineno: 3, new_lineno: 4, content: "export { a, b };\n" },
        ],
      },
    ],
  };

  it("renders unstaged diff with Stage Hunk and Stage Line buttons", async () => {
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(sampleDiff);

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
      expect(screen.getByText("@@ -1,3 +1,4 @@")).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => {
          const hasText = el?.textContent?.includes("const b = 2;") ?? false;
          const childrenDontHaveText = Array.from(el?.children || []).every(
            (child) => !child.textContent?.includes("const b = 2;")
          );
          return hasText && childrenDontHaveText;
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => {
          const hasText = el?.textContent?.includes("const b = 20;") ?? false;
          const childrenDontHaveText = Array.from(el?.children || []).every(
            (child) => !child.textContent?.includes("const b = 20;")
          );
          return hasText && childrenDontHaveText;
        })
      ).toBeInTheDocument();
    });

    // Stage Hunk button exists
    const stageHunkBtn = screen.getByTestId("stage-hunk-0");
    expect(stageHunkBtn).toBeInTheDocument();
    fireEvent.click(stageHunkBtn);
    expect(mockOnStageHunk).toHaveBeenCalledWith(0);

    // Stage Line button on modified line
    const stageLineBtn = screen.getByTestId("stage-line-0-2");
    expect(stageLineBtn).toBeInTheDocument();
    fireEvent.click(stageLineBtn);
    expect(mockOnStageLines).toHaveBeenCalledWith(0, [2]);
  });

  it("renders staged diff with Unstage Hunk and Unstage Line buttons", async () => {
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(sampleDiff);

    render(
      <QueryClientProvider client={queryClient}>
        <InteractiveDiffViewer
          repoPath="/test/repo"
          filePath="src/sample.ts"
          isStaged={true}
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

    const unstageHunkBtn = screen.getByTestId("unstage-hunk-0");
    expect(unstageHunkBtn).toBeInTheDocument();
    fireEvent.click(unstageHunkBtn);
    expect(mockOnUnstageHunk).toHaveBeenCalledWith(0);

    const unstageLineBtn = screen.getByTestId("unstage-line-0-2");
    expect(unstageLineBtn).toBeInTheDocument();
    fireEvent.click(unstageLineBtn);
    expect(mockOnUnstageLines).toHaveBeenCalledWith(0, [2]);
  });

  it("handles binary file diff display", async () => {
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue({
      file_path: "image.png",
      status: "Binary",
      additions: 0,
      deletions: 0,
      hunks: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InteractiveDiffViewer
          repoPath="/test/repo"
          filePath="image.png"
          isStaged={false}
          onStageHunk={mockOnStageHunk}
          onUnstageHunk={mockOnUnstageHunk}
          onStageLines={mockOnStageLines}
          onUnstageLines={mockOnUnstageLines}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tệp nhị phân/i)).toBeInTheDocument();
    });
  });
});
