import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlameView } from "./BlameView";
import { useSettingsStore } from "../../store/useSettingsStore";
import type { FileBlameResult } from "../../ipc/bindings.generated";

vi.mock("../../ipc/client", () => ({
  invokeCommand: {
    getFileBlame: vi.fn(),
  },
}));

import { invokeCommand } from "../../ipc/client";

const blame: FileBlameResult = {
  file_path: "src/index.ts",
  commit_id: null,
  total_lines: 1,
  lines: [
    {
      line_no: 1,
      content: "import React from 'react';",
      commit_id: "c1a2b3c4d5e6f7890123456789abcdef01234567",
      short_id: "c1a2b3c",
      summary: "initial commit",
      author_name: "GitVista Team",
      author_email: "team@gitvista.dev",
      timestamp_sec: 1700000000,
      is_hunk_start: true,
    },
  ],
};

beforeEach(() => {
  useSettingsStore.setState({ locale: "en" });
  vi.mocked(invokeCommand.getFileBlame).mockResolvedValue(blame);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BlameView repoPath="/test/repo" filePath="src/index.ts" commitId={null} />
    </QueryClientProvider>
  );
}

describe("BlameView", () => {
  it("calls getFileBlame with the exact query arguments and renders the blame author", async () => {
    renderView();

    expect(invokeCommand.getFileBlame).toHaveBeenCalledWith("/test/repo", "src/index.ts", null);

    expect(await screen.findByText("GitVista Team")).toBeInTheDocument();
  });
});
