import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PullRequestDetailDrawer } from "../components/pullrequests/PullRequestDetailDrawer";
import * as githubService from "../services/githubService";
import { invokeCommand } from "../ipc/client";
import { usePullRequestStore } from "../store/usePullRequestStore";
import { vi as viTranslations } from "../i18n/vi";

const t = viTranslations;

vi.mock("../services/githubService", () => ({
  fetchPullRequestDetail: vi.fn(),
}));

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getGitHubRepoInfo: vi.fn(),
    getGitHubToken: vi.fn(),
    checkoutPullRequest: vi.fn(),
  },
}));

describe("PullRequestDetailDrawer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders PR details, CI checks, and handles checkout branch", async () => {
    vi.mocked(invokeCommand.getGitHubRepoInfo).mockResolvedValue({
      is_github: true,
      owner: "org",
      repo: "repo",
      default_branch: "main",
    });
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue("token");
    vi.mocked(invokeCommand.checkoutPullRequest).mockResolvedValue({
      branch_name: "pr/55",
      message: "Success",
    });

    const mockPr = {
      number: 55,
      title: "Improve Performance",
      state: "open" as const,
      draft: false,
      user: { login: "developer", avatar_url: "", html_url: "" },
      created_at: "2026-09-18T10:00:00Z",
      updated_at: "2026-09-18T10:00:00Z",
      head: { ref: "perf-patch", sha: "abc111" },
      base: { ref: "main", sha: "def222" },
      comments: 1,
      labels: [],
      html_url: "https://github.com/org/repo/pull/55",
    };

    vi.mocked(githubService.fetchPullRequestDetail).mockResolvedValue({
      pr: mockPr,
      body: "This PR optimizes list rendering.",
      mergeable: true,
      assignees: [],
      requested_reviewers: [],
      check_runs: [
        {
          name: "vitest-ci",
          status: "success",
          details_url: "https://ci.url",
        },
      ],
      files: [
        {
          filename: "src/list.ts",
          status: "modified",
          additions: 10,
          deletions: 2,
          changes: 12,
        },
      ],
      commits_count: 2,
    });

    usePullRequestStore.setState({
      isDrawerOpen: true,
      selectedPr: mockPr,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PullRequestDetailDrawer repoPath="/path/to/repo" />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Improve Performance")).toBeInTheDocument();
    expect(await screen.findByText("This PR optimizes list rendering.")).toBeInTheDocument();
    expect(await screen.findByText("vitest-ci")).toBeInTheDocument();
    expect(await screen.findByText("src/list.ts")).toBeInTheDocument();

    const checkoutBtn = screen.getByText(t.pullRequests.checkout);
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(invokeCommand.checkoutPullRequest).toHaveBeenCalledWith("/path/to/repo", 55);
    });
  });
});
