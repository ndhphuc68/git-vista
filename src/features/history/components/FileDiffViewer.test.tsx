import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileDiffViewer } from "./FileDiffViewer";
import { useSettingsStore } from "../../../store/useSettingsStore";
import type { FileDiffResult } from "../../../ipc/bindings.generated";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    getCommitFileDiff: vi.fn(),
  },
}));

import { invokeCommand } from "../../../ipc/client";

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

beforeEach(() => {
  useSettingsStore.setState({ locale: "en", diffIgnoreWhitespace: false });
  vi.mocked(invokeCommand.getCommitFileDiff).mockResolvedValue(diff);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FileDiffViewer repoPath="/test/repo" commitId="commit-1" filePath="src/example.ts" />
    </QueryClientProvider>
  );
}

describe("FileDiffViewer", () => {
  it("calls getCommitFileDiff with the exact query arguments and renders the diff", async () => {
    renderView();

    expect(invokeCommand.getCommitFileDiff).toHaveBeenCalledWith(
      "/test/repo",
      "commit-1",
      "src/example.ts",
      false
    );

    await screen.findByText("src/example.ts");
    expect(document.body.textContent).toContain("const a = 2;");
  });

  it("renders the hunk header, line numbers, signs and contents", async () => {
    renderView();

    expect(await screen.findByText("@@ -1,2 +1,2 @@")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(3);
  });

  it("applies the diff font size and hides line numbers when turned off", async () => {
    useSettingsStore.setState({ diffFontSize: 16, diffShowLineNumbers: false });
    const { container } = renderView();

    await screen.findByText("@@ -1,2 +1,2 @@");
    expect(container.querySelector('[style*="font-size: 16px"]')).not.toBeNull();
    expect(screen.queryByTestId("diff-line-numbers")).not.toBeInTheDocument();
    useSettingsStore.setState({ diffFontSize: 13, diffShowLineNumbers: true });
  });
});
