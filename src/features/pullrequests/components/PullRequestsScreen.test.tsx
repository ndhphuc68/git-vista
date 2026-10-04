import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PullRequestsScreen } from "./PullRequestsScreen";
import { usePullRequestStore } from "../../../store/usePullRequestStore";
import { useToastStore } from "../../../store/useToastStore";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { usePullRequests, usePullRequestDetail } from "../api";
import { checkoutPullRequest } from "../../github";
import type { GitHubPullRequest, PullRequestDetail } from "../../../ipc/githubApi";

vi.mock("../api", () => ({
  usePullRequests: vi.fn(),
  usePullRequestDetail: vi.fn(),
}));

vi.mock("../../github", () => ({
  checkoutPullRequest: vi.fn(),
  useGitHubRepoInfo: vi.fn(),
  useGitHubToken: vi.fn(),
}));

const mockPr1: GitHubPullRequest = {
  number: 101,
  title: "Add search functionality",
  state: "open",
  draft: false,
  merged_at: null,
  user: { login: "alice", avatar_url: "", html_url: "https://github.com/alice" },
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
  head: { ref: "feature/search", sha: "111" },
  base: { ref: "main", sha: "000" },
  comments: 2,
  labels: [{ id: 1, name: "feature", color: "a2eeef", description: "" }],
  html_url: "https://github.com/org/repo/pull/101",
};

const mockPr2: GitHubPullRequest = {
  number: 102,
  title: "Fix crash on startup",
  state: "closed",
  draft: false,
  merged_at: "2026-03-02T10:00:00Z",
  user: { login: "bob", avatar_url: "", html_url: "https://github.com/bob" },
  created_at: "2026-03-02T10:00:00Z",
  updated_at: "2026-03-02T10:00:00Z",
  head: { ref: "bugfix/crash", sha: "222" },
  base: { ref: "main", sha: "000" },
  comments: 0,
  labels: [{ id: 2, name: "bug", color: "ff0000", description: "" }],
  html_url: "https://github.com/org/repo/pull/102",
};

const mockDetail: PullRequestDetail = {
  pr: mockPr1,
  body: "Implements fuzzy search across files.",
  mergeable: true,
  assignees: [],
  requested_reviewers: [],
  check_runs: [
    { name: "build", status: "success", details_url: "https://ci.test/build" },
  ],
  files: [
    {
      filename: "src/search.ts",
      status: "added",
      additions: 15,
      deletions: 0,
      changes: 15,
      patch: "@@ -0,0 +1,15 @@\n+// new search code",
    },
  ],
  commits_count: 2,
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("PullRequestsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ locale: "en" });
    useToastStore.setState({ toasts: [] });
    usePullRequestStore.setState({
      selectedPr: null,
      isDrawerOpen: false,
      isCreateModalOpen: false,
    });

    vi.mocked(usePullRequests).mockReturnValue({
      data: [mockPr1, mockPr2],
      isLoading: false,
    } as unknown as ReturnType<typeof usePullRequests>);

    vi.mocked(usePullRequestDetail).mockReturnValue({
      data: mockDetail,
      isLoading: false,
    } as unknown as ReturnType<typeof usePullRequestDetail>);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders master-detail layout and empty selection state when no PR is selected", () => {
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    expect(screen.getByText("Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("New PR")).toBeInTheDocument();
    expect(screen.getByText("Select a pull request from the list to view details")).toBeInTheDocument();
    expect(screen.getByText("Add search functionality")).toBeInTheDocument();
    expect(screen.getByText("Fix crash on startup")).toBeInTheDocument();
  });

  it("filters PRs in master pane using search input", () => {
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const searchInput = screen.getByPlaceholderText("Search by title, #number, author...");
    fireEvent.change(searchInput, { target: { value: "search" } });

    expect(screen.getByText("Add search functionality")).toBeInTheDocument();
    expect(screen.queryByText("Fix crash on startup")).not.toBeInTheDocument();
  });

  it("shows empty list message when search matches no PRs", () => {
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const searchInput = screen.getByPlaceholderText("Search by title, #number, author...");
    fireEvent.change(searchInput, { target: { value: "non-existent" } });

    expect(screen.getByText("No pull requests found")).toBeInTheDocument();
  });

  it("selects a PR from master pane and renders details in detail pane", () => {
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const prItem = screen.getByText("Add search functionality");
    fireEvent.click(prItem);

    expect(usePullRequestStore.getState().selectedPr?.number).toBe(101);
    expect(screen.getByText("Implements fuzzy search across files.")).toBeInTheDocument();
    expect(screen.getAllByText("feature/search").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("main").length).toBeGreaterThanOrEqual(1);
  });

  it("switches between Conversation and Files Changed sub-tabs", () => {
    usePullRequestStore.setState({ selectedPr: mockPr1 });
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    expect(screen.getByText("Implements fuzzy search across files.")).toBeInTheDocument();

    const filesChangedTab = screen.getByRole("tab", { name: /Files Changed/i });
    fireEvent.click(filesChangedTab);

    expect(screen.getAllByText("src/search.ts").length).toBeGreaterThanOrEqual(1);
  });

  it("triggers checkout action from detail pane toolbar", async () => {
    usePullRequestStore.setState({ selectedPr: mockPr1 });
    vi.mocked(checkoutPullRequest).mockResolvedValue({
      branch_name: "pr-101",
      message: "Switched",
    });

    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const checkoutBtn = screen.getByRole("button", { name: /Checkout PR Branch/i });
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(checkoutPullRequest).toHaveBeenCalledWith("/test/repo", 101);
    });
  });

  it("copies PR link to clipboard", async () => {
    usePullRequestStore.setState({ selectedPr: mockPr1 });
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const copyBtn = screen.getByTitle("Copy PR Link");
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(mockPr1.html_url);
    });
  });

  it("opens PR in browser", () => {
    usePullRequestStore.setState({ selectedPr: mockPr1 });
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);

    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const browserBtn = screen.getByTitle("Open on GitHub.com");
    fireEvent.click(browserBtn);

    expect(openMock).toHaveBeenCalledWith(mockPr1.html_url, "_blank");
  });

  it("opens PR in browser when clicking PR number link", () => {
    usePullRequestStore.setState({ selectedPr: mockPr1 });
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);

    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const prNumberLink = screen.getByRole("link", { name: new RegExp(`#${mockPr1.number}`) });
    fireEvent.click(prNumberLink);

    expect(openMock).toHaveBeenCalledWith(mockPr1.html_url, "_blank");
  });

  it("opens create PR modal when New PR button is clicked", () => {
    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    const newPrBtn = screen.getByRole("button", { name: /New PR/i });
    fireEvent.click(newPrBtn);

    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(true);
  });

  it("ignores selectedPr from a different repo", () => {
    usePullRequestStore.setState({
      selectedPr: mockPr1,
      selectedRepoPath: "/different/repo",
    });

    renderWithClient(<PullRequestsScreen repoPath="/test/repo" />);

    expect(
      screen.getByText("Select a pull request from the list to view details")
    ).toBeInTheDocument();
    expect(screen.queryByText("Implements fuzzy search across files.")).not.toBeInTheDocument();
  });

  it("clears search query when switching repoPath", () => {
    const { rerender } = renderWithClient(<PullRequestsScreen repoPath="/test/repo1" />);

    const searchInput = screen.getByPlaceholderText("Search by title, #number, author...");
    fireEvent.change(searchInput, { target: { value: "search" } });
    expect(searchInput).toHaveValue("search");

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <PullRequestsScreen key="/test/repo2" repoPath="/test/repo2" />
      </QueryClientProvider>
    );

    const newSearchInput = screen.getByPlaceholderText("Search by title, #number, author...");
    expect(newSearchInput).toHaveValue("");
  });
});

