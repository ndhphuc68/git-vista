import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommitGraph } from "../features/history";
import { CreateTagModal } from "../features/tag";
import { CreateBranchModal } from "../features/branch";
import { useRepoStore } from "../store/useRepoStore";
import { useViewStore } from "../store/useViewStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { invokeCommand } from "../ipc/client";

const REPO_PATH = "d:/project-v3";

const commits = [
  {
    id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    short_id: "aaaaaaa",
    summary: "third commit",
    author_name: "Author Three",
    author_email: "three@example.com",
    timestamp_sec: 3000,
    parent_ids: ["bbb"],
    col: 0,
    color_index: 0,
    lines: [],
    refs: [{ name: "main", ref_type: "head" as const }],
  },
  {
    id: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    short_id: "bbbbbbb",
    summary: "second commit",
    author_name: "Author Two",
    author_email: "two@example.com",
    timestamp_sec: 2000,
    parent_ids: ["ccc"],
    col: 0,
    color_index: 0,
    lines: [],
    refs: [],
  },
  {
    id: "cccccccccccccccccccccccccccccccccccccccc",
    short_id: "ccccccc",
    summary: "first commit",
    author_name: "Author One",
    author_email: "one@example.com",
    timestamp_sec: 1000,
    parent_ids: [],
    col: 0,
    color_index: 0,
    lines: [],
    refs: [],
  },
];

describe("CommitGraphRows (via CommitGraph)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useSettingsStore.setState({ locale: "en" });
    useRepoStore.getState().setRepo({
      path: REPO_PATH,
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: commits[0]!.id,
    });
    useViewStore.setState({ activeScreen: "history" });
    vi.spyOn(invokeCommand, "getCommitGraph").mockResolvedValue({
      commits,
      has_more: false,
      total_count: commits.length,
    });
    vi.spyOn(invokeCommand, "getRepoStatus").mockResolvedValue({
      staged: [{ path: "src/staged.ts", status: "Modified", is_staged: true, old_path: null }],
      unstaged: [],
      untracked: [
        { path: "src/new.ts", status: "New", is_staged: false, old_path: null },
        { path: "src/new2.ts", status: "New", is_staged: false, old_path: null },
      ],
      conflicted: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderGraph() {
    return render(
      <QueryClientProvider client={queryClient}>
        <CommitGraph CreateTagModal={CreateTagModal} CreateBranchModal={CreateBranchModal} />
      </QueryClientProvider>
    );
  }

  it("shows the WIP row with modified/new counts and navigates to Changes on click", async () => {
    renderGraph();
    await screen.findByText("third commit");

    const wipRow = screen.getByLabelText("Working directory has uncommitted changes");
    expect(wipRow).toBeInTheDocument();
    expect(screen.getByText(/1 modified/)).toBeInTheDocument();
    expect(screen.getByText(/2 new/)).toBeInTheDocument();

    fireEvent.click(wipRow);
    expect(useViewStore.getState().activeScreen).toBe("changes");
  });

  it("shows the author email after the name and a commit date column", async () => {
    renderGraph();
    const row = (await screen.findByText("third commit")).closest('[role="button"]') as HTMLElement;

    expect(screen.getByText("DATE")).toBeInTheDocument();
    expect(within(row).getByText("Author Three")).toBeInTheDocument();
    expect(within(row).getByText("three@example.com")).toBeInTheDocument();
    const d = new Date(3000 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(
      within(row).getByText(
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      )
    ).toBeInTheDocument();
  });

  it("selects the next/previous commit with ArrowDown/ArrowUp", async () => {
    renderGraph();
    const firstRow = await screen.findByText("third commit");
    const rowEl = firstRow.closest('[role="button"]') as HTMLElement;
    rowEl.focus();

    fireEvent.keyDown(rowEl, { key: "ArrowDown" });
    expect(useRepoStore.getState().selectedCommitId).toBe(commits[1]!.id);

    const secondRowEl = (await screen.findByText("second commit")).closest(
      '[role="button"]'
    ) as HTMLElement;
    fireEvent.keyDown(secondRowEl, { key: "ArrowUp" });
    expect(useRepoStore.getState().selectedCommitId).toBe(commits[0]!.id);
  });

  it("opens the compare dialog on ctrl+click of a second commit", async () => {
    renderGraph();
    const firstRow = await screen.findByText("third commit");
    fireEvent.click(firstRow);
    expect(useRepoStore.getState().selectedCommitId).toBe(commits[0]!.id);

    const secondRow = await screen.findByText("second commit");
    fireEvent.click(secondRow, { ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Compare Commits & Branches")).toBeInTheDocument();
    });
  });
});
