import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PullRequestsSection } from "../components/sidebar/PullRequestsSection";
import * as githubService from "../services/githubService";
import { invokeCommand } from "../ipc/client";
import { usePullRequestStore } from "../store/usePullRequestStore";
import { vi as viTranslations } from "../i18n/vi";

const t = viTranslations;

vi.mock("../services/githubService", () => ({
  fetchPullRequests: vi.fn(),
  fetchPullRequestDetail: vi.fn(),
}));

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    getGitHubRepoInfo: vi.fn(),
    getGitHubToken: vi.fn(),
    checkoutPullRequest: vi.fn(),
  },
}));

describe("PullRequestsSection", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    usePullRequestStore.setState({
      isDrawerOpen: false,
      selectedPr: null,
      isCreateModalOpen: false,
    });
  });

  it("renders PR items and triggers drawer on click", async () => {
    vi.mocked(invokeCommand.getGitHubRepoInfo).mockResolvedValue({
      is_github: true,
      owner: "my-org",
      repo: "my-repo",
      default_branch: "main",
    });
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue("mock_token");

    const mockPrs = [
      {
        number: 101,
        title: "Awesome Feature",
        state: "open" as const,
        draft: false,
        user: { login: "alice", avatar_url: "https://avatar.url/1", html_url: "" },
        created_at: "2026-09-18T10:00:00Z",
        updated_at: "2026-09-18T10:00:00Z",
        head: { ref: "feature", sha: "111" },
        base: { ref: "main", sha: "222" },
        comments: 3,
        labels: [],
        html_url: "https://github.com/my-org/my-repo/pull/101",
      },
    ];

    vi.mocked(githubService.fetchPullRequests).mockResolvedValue(mockPrs);

    render(
      <QueryClientProvider client={queryClient}>
        <PullRequestsSection repoPath="/path/to/repo" />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Awesome Feature")).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();

    // Click PR to open drawer
    fireEvent.click(screen.getByText("Awesome Feature"));
    expect(usePullRequestStore.getState().isDrawerOpen).toBe(true);
    expect(usePullRequestStore.getState().selectedPr?.number).toBe(101);
  });

  it("opens create PR modal when clicking + button", async () => {
    vi.mocked(invokeCommand.getGitHubRepoInfo).mockResolvedValue({
      is_github: true,
      owner: "my-org",
      repo: "my-repo",
      default_branch: "main",
    });
    vi.mocked(invokeCommand.getGitHubToken).mockResolvedValue(null);
    vi.mocked(githubService.fetchPullRequests).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <PullRequestsSection repoPath="/path/to/repo" />
      </QueryClientProvider>
    );

    const addBtn = await screen.findByTitle(t.pullRequests.newPr);
    fireEvent.click(addBtn);

    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(true);
  });
});
