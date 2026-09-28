import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompareDiffViewer } from "./CompareDiffViewer";
import { useSettingsStore } from "../../store/useSettingsStore";
import type { FileDiffResult, CompareFileItem } from "../../ipc/bindings.generated";

vi.mock("../../ipc/client", () => ({
  invokeCommand: {
    getCompareFileDiff: vi.fn(),
  },
}));

import { invokeCommand } from "../../ipc/client";

const diff: FileDiffResult = {
  file_path: "src/example.ts",
  status: "modified",
  additions: 1,
  deletions: 1,
  hunks: [
    {
      header: "@@ -1,2 +1,2 @@",
      old_start: 1,
      old_lines: 2,
      new_start: 1,
      new_lines: 2,
      lines: [
        { line_type: "delete", content: "const a = 1;\n", old_lineno: 1, new_lineno: null },
        { line_type: "add", content: "const a = 2;\n", old_lineno: null, new_lineno: 1 },
      ],
    },
  ],
};

const file: CompareFileItem = {
  path: "src/example.ts",
  old_path: null,
  status: "modified",
  additions: 1,
  deletions: 1,
  is_binary: false,
};

beforeEach(() => {
  useSettingsStore.setState({ locale: "en", diffIgnoreWhitespace: true });
  vi.mocked(invokeCommand.getCompareFileDiff).mockResolvedValue(diff);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompareDiffViewer
        repoPath="/test/repo"
        baseRev="main"
        targetRev="HEAD"
        file={file}
        mode="MergeBase"
      />
    </QueryClientProvider>
  );
}

describe("CompareDiffViewer", () => {
  it("calls getCompareFileDiff with the exact query arguments, including ignoreWhitespace, and renders a hunk line", async () => {
    renderView();

    expect(invokeCommand.getCompareFileDiff).toHaveBeenCalledWith(
      "/test/repo",
      "main",
      "HEAD",
      "src/example.ts",
      "MergeBase",
      true
    );

    await screen.findByText("src/example.ts");
    expect(document.body.textContent).toContain("const a = 2;");
  });
});
