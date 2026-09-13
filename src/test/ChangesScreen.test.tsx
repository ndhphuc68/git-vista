import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChangesScreen } from "../components/changes/ChangesScreen";
import { useRepoStore } from "../store/useRepoStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { invokeCommand } from "../ipc/client";

describe("ChangesScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useRepoStore.getState().setRepo({
      path: "/test/repo",
      name: "test-repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc1234",
    });
    useLayoutStore.setState({
      sidebarOpen: true,
      detailPanelOpen: true,
      controlsOpen: true,
      devToolsOpen: false,
      activeChangesView: "split",
    });
    vi.clearAllMocks();
  });

  const mockStatus = {
    staged: [
      { path: "src/staged.ts", status: "Modified" as const, is_staged: true, old_path: null },
    ],
    unstaged: [
      { path: "src/unstaged.ts", status: "Modified" as const, is_staged: false, old_path: null },
    ],
    untracked: [],
  };

  const mockDiff = {
    file_path: "src/staged.ts",
    status: "Modified",
    additions: 1,
    deletions: 0,
    hunks: [
      {
        header: "@@ -1,1 +1,2 @@",
        old_start: 1,
        old_lines: 1,
        new_start: 1,
        new_lines: 2,
        lines: [
          { line_type: "context", old_lineno: 1, new_lineno: 1, content: "base code\n" },
          { line_type: "add", old_lineno: null, new_lineno: 2, content: "new code\n" },
        ],
      },
    ],
  };

  it("renders 2-column layout with StagingFileList, CommitBox, and diff viewer", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue(mockStatus);
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(mockDiff);

    render(
      <QueryClientProvider client={queryClient}>
        <ChangesScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("src/staged.ts").length).toBeGreaterThan(0);
      expect(screen.getByText("src/unstaged.ts")).toBeInTheDocument();
      expect(screen.getByTestId("commit-summary-input")).toBeInTheDocument();
      expect(screen.getByTestId("commit-button")).toBeInTheDocument();
      expect(screen.getByText(/new code/)).toBeInTheDocument();
    });
  });

  it("stages a file and invalidates query", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue(mockStatus);
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(mockDiff);
    const stageSpy = vi.spyOn(invokeCommand, "stageFile").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <ChangesScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("stage-file-src/unstaged.ts")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("stage-file-src/unstaged.ts"));

    await waitFor(() => {
      expect(stageSpy).toHaveBeenCalledWith("/test/repo", "src/unstaged.ts");
    });
  });

  it("creates a commit through CommitBox", async () => {
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue(mockStatus);
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(mockDiff);
    const commitSpy = vi.spyOn(invokeCommand, "createCommit").mockResolvedValue({
      id: "new123",
      full_message: "feat: test commit",
      author_name: "Tester",
      author_email: "test@example.com",
      author_timestamp_sec: 12345678,
      parent_ids: ["abc1234"],
      files: [],
      total_additions: 1,
      total_deletions: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ChangesScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("src/staged.ts")).toBeInTheDocument();
      expect(screen.getByTestId("commit-summary-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("commit-summary-input"), {
      target: { value: "feat: test commit" },
    });

    const commitBtn = screen.getByTestId("commit-button");
    expect(commitBtn).not.toBeDisabled();
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledWith(
        "/test/repo",
        "feat: test commit",
        undefined,
        false
      );
    });
  });

  it("hides sidebar when sidebarOpen is false", async () => {
    useLayoutStore.setState({ sidebarOpen: false });

    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue(mockStatus);
    vi.spyOn(invokeCommand, "getWorkingFileDiff").mockResolvedValue(mockDiff);

    render(
      <QueryClientProvider client={queryClient}>
        <ChangesScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("changes-sidebar")).not.toBeInTheDocument();
      expect(screen.getByTestId("changes-diff-viewer")).toBeInTheDocument();
    });
  });
});
