import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPullRequestsScreenActions } from "./usePullRequestsScreen.actions";
import { checkoutPullRequest } from "../../github";
import { openExternalUrl } from "../../repo";
import { qk } from "../../../domain/queryKeys";
import { usePullRequestStore } from "../../../store/usePullRequestStore";
import { en } from "../../../i18n/en";
import type { GitHubPullRequest } from "../../../ipc/githubApi";
import type { QueryClient } from "@tanstack/react-query";

vi.mock("../../github", () => ({
  checkoutPullRequest: vi.fn(),
  useGitHubRepoInfo: vi.fn(),
  useGitHubToken: vi.fn(),
}));

vi.mock("../../repo", () => ({
  openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

const mockPr: GitHubPullRequest = {
  number: 42,
  title: "Test PR",
  state: "open",
  draft: false,
  merged_at: null,
  user: { login: "tester", avatar_url: "", html_url: "" },
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
  head: { ref: "feature/test", sha: "111" },
  base: { ref: "main", sha: "000" },
  comments: 0,
  labels: [],
  html_url: "https://github.com/org/repo/pull/42",
};

describe("createPullRequestsScreenActions", () => {
  const showToast = vi.fn();
  const showSuccess = vi.fn();
  const showError = vi.fn();
  const setIsCheckingOut = vi.fn();
  const invalidateQueries = vi.fn().mockResolvedValue(undefined);

  const mockQueryClient = {
    invalidateQueries,
  } as unknown as QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles checkout successfully with toasts and query invalidations", async () => {
    vi.mocked(checkoutPullRequest).mockResolvedValue({
      branch_name: "pr-42",
      message: "Switched",
    });

    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
      setIsCheckingOut,
    });

    await actions.handleCheckout(mockPr);

    expect(setIsCheckingOut).toHaveBeenCalledWith(true);
    expect(showToast).toHaveBeenCalledWith({
      message: en.pullRequests.checkingOut,
      type: "info",
    });
    expect(checkoutPullRequest).toHaveBeenCalledWith("/repo", 42);
    expect(showSuccess).toHaveBeenCalledWith(
      en.pullRequests.checkoutSuccess.replace("{branch}", "pr-42")
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: qk.branches("/repo"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: qk.commitGraph("/repo"),
    });
    expect(setIsCheckingOut).toHaveBeenCalledWith(false);
  });

  it("handles checkout failure with error toast", async () => {
    vi.mocked(checkoutPullRequest).mockRejectedValue(new Error("Git checkout conflict"));

    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
      setIsCheckingOut,
    });

    await actions.handleCheckout(mockPr);

    expect(showError).toHaveBeenCalledWith("Git checkout conflict");
    expect(setIsCheckingOut).toHaveBeenCalledWith(false);
  });

  it("handles copy link to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
    });

    await actions.handleCopyLink(mockPr);

    expect(writeTextMock).toHaveBeenCalledWith(mockPr.html_url);
    expect(showSuccess).toHaveBeenCalledWith(en.pullRequests.linkCopied);
  });

  it("opens the pull request in the system browser", () => {
    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
    });

    actions.handleOpenBrowser(mockPr);

    expect(openExternalUrl).toHaveBeenCalledWith(mockPr.html_url);
  });

  it("opens create modal on handleNewPr", () => {
    const openCreateModalSpy = vi.spyOn(usePullRequestStore.getState(), "openCreateModal");

    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
    });

    actions.handleNewPr();

    expect(openCreateModalSpy).toHaveBeenCalled();
  });

  it("invalidates PR list and detail on handleRefresh", async () => {
    const actions = createPullRequestsScreenActions({
      repoPath: "/repo",
      t: en,
      queryClient: mockQueryClient,
      showToast,
      showSuccess,
      showError,
    });

    await actions.handleRefresh("open", 42);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: qk.github.pullRequests("/repo", "open"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: qk.github.pullRequestDetail("/repo", 42),
    });
  });
});
