import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileHistoryView } from "./FileHistoryView";
import { useSettingsStore } from "../../store/useSettingsStore";
import type { FileHistoryResult } from "../../ipc/bindings.generated";

vi.mock("../../ipc/client", () => ({
  invokeCommand: {
    getFileHistory: vi.fn(),
    getCommitFileDiff: vi.fn(),
  },
}));

import { invokeCommand } from "../../ipc/client";

const history: FileHistoryResult = {
  file_path: "src/index.ts",
  total_count: 1,
  has_more: false,
  commits: [
    {
      commit_id: "d4e5f6a1b2c37890123456789abcdef012345678",
      short_id: "d4e5f6a",
      summary: "refactor exports",
      author_name: "PhucNDH",
      author_email: "phuc@example.com",
      timestamp_sec: 1700000000,
      change_type: "modified",
    },
  ],
};

beforeEach(() => {
  useSettingsStore.setState({ locale: "en" });
  vi.mocked(invokeCommand.getFileHistory).mockResolvedValue(history);
  vi.mocked(invokeCommand.getCommitFileDiff).mockResolvedValue({
    file_path: "src/index.ts",
    status: "modified",
    additions: 0,
    deletions: 0,
    hunks: [],
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FileHistoryView repoPath="/test/repo" filePath="src/index.ts" />
    </QueryClientProvider>
  );
}

describe("FileHistoryView", () => {
  it("calls getFileHistory with the exact query arguments and renders the commit summary", async () => {
    renderView();

    expect(invokeCommand.getFileHistory).toHaveBeenCalledWith("/test/repo", "src/index.ts", 0, 100);

    expect(await screen.findByText("refactor exports")).toBeInTheDocument();
  });
});
