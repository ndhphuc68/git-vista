import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { usePullRequests } from "./usePullRequests";
import { usePullRequestDetail } from "./usePullRequestDetail";
import { useGitHubRepoInfo, useGitHubToken } from "../../github";
import { fetchPullRequests, fetchPullRequestDetail } from "../../../services/githubService";
import { type GitHubPullRequest, type PullRequestDetail } from "../../../ipc/githubApi";

vi.mock("../../github", () => ({
  useGitHubRepoInfo: vi.fn(),
  useGitHubToken: vi.fn(),
}));

vi.mock("../../../services/githubService", () => ({
  fetchPullRequests: vi.fn(),
  fetchPullRequestDetail: vi.fn(),
}));

const REPO_PATH = "/path/to/my-repo";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("usePullRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetchPullRequests with owner, repo, token, and state when enabled", async () => {
    vi.mocked(useGitHubRepoInfo).mockReturnValue({
      data: { is_github: true, owner: "test-owner", repo: "test-repo", default_branch: "main" },
    } as unknown as ReturnType<typeof useGitHubRepoInfo>);
    vi.mocked(useGitHubToken).mockReturnValue({
      data: "secret-token",
    } as unknown as ReturnType<typeof useGitHubToken>);

    const mockPrs: GitHubPullRequest[] = [
      {
        number: 1,
        title: "PR 1",
        state: "open",
        draft: false,
        user: { login: "alice", avatar_url: "", html_url: "" },
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        head: { ref: "feature", sha: "111" },
        base: { ref: "main", sha: "000" },
        comments: 0,
        labels: [],
        html_url: "https://github.com/test-owner/test-repo/pull/1",
      },
    ];
    vi.mocked(fetchPullRequests).mockResolvedValue(mockPrs);

    const { result } = renderHook(() => usePullRequests(REPO_PATH, "open"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPullRequests).toHaveBeenCalledWith(
      "test-owner",
      "test-repo",
      "secret-token",
      "open"
    );
    expect(result.current.data).toEqual(mockPrs);
  });

  it("defaults state to 'open' when state parameter is omitted", async () => {
    vi.mocked(useGitHubRepoInfo).mockReturnValue({
      data: { is_github: true, owner: "test-owner", repo: "test-repo", default_branch: "main" },
    } as unknown as ReturnType<typeof useGitHubRepoInfo>);
    vi.mocked(useGitHubToken).mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useGitHubToken>);
    vi.mocked(fetchPullRequests).mockResolvedValue([]);

    const { result } = renderHook(() => usePullRequests(REPO_PATH), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPullRequests).toHaveBeenCalledWith("test-owner", "test-repo", null, "open");
  });

  it("is disabled when repoInfo is not a GitHub repository", () => {
    vi.mocked(useGitHubRepoInfo).mockReturnValue({
      data: { is_github: false, owner: "", repo: "", default_branch: "" },
    } as unknown as ReturnType<typeof useGitHubRepoInfo>);
    vi.mocked(useGitHubToken).mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useGitHubToken>);

    const { result } = renderHook(() => usePullRequests(REPO_PATH), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchPullRequests).not.toHaveBeenCalled();
  });
});

describe("usePullRequestDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is disabled and does not call fetchPullRequestDetail when prNumber is null", () => {
    vi.mocked(useGitHubRepoInfo).mockReturnValue({
      data: { is_github: true, owner: "test-owner", repo: "test-repo", default_branch: "main" },
    } as unknown as ReturnType<typeof useGitHubRepoInfo>);
    vi.mocked(useGitHubToken).mockReturnValue({
      data: "secret-token",
    } as unknown as ReturnType<typeof useGitHubToken>);

    const { result } = renderHook(() => usePullRequestDetail(REPO_PATH, null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchPullRequestDetail).not.toHaveBeenCalled();
  });

  it("queries pull request detail when prNumber is provided", async () => {
    vi.mocked(useGitHubRepoInfo).mockReturnValue({
      data: { is_github: true, owner: "test-owner", repo: "test-repo", default_branch: "main" },
    } as unknown as ReturnType<typeof useGitHubRepoInfo>);
    vi.mocked(useGitHubToken).mockReturnValue({
      data: "my-token",
    } as unknown as ReturnType<typeof useGitHubToken>);

    const mockDetail: PullRequestDetail = {
      pr: {
        number: 42,
        title: "Fix issue 42",
        state: "open",
        draft: false,
        user: { login: "bob", avatar_url: "", html_url: "" },
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        head: { ref: "fix-42", sha: "aaa" },
        base: { ref: "main", sha: "bbb" },
        comments: 2,
        labels: [],
        html_url: "https://github.com/test-owner/test-repo/pull/42",
      },
      body: "Description",
      mergeable: true,
      assignees: [],
      requested_reviewers: [],
      check_runs: [],
      files: [],
      commits_count: 1,
    };
    vi.mocked(fetchPullRequestDetail).mockResolvedValue(mockDetail);

    const { result } = renderHook(() => usePullRequestDetail(REPO_PATH, 42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPullRequestDetail).toHaveBeenCalledWith("test-owner", "test-repo", 42, "my-token");
    expect(result.current.data).toEqual(mockDetail);
  });
});
