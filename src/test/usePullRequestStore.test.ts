import { describe, it, expect, beforeEach } from "vitest";
import { usePullRequestStore } from "../store/usePullRequestStore";
import { type GitHubPullRequest } from "../ipc/githubApi";

const dummyPr: GitHubPullRequest = {
  number: 12,
  title: "Test PR",
  state: "open",
  draft: false,
  user: { login: "alice", avatar_url: "", html_url: "" },
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
  head: { ref: "feature", sha: "abc" },
  base: { ref: "main", sha: "def" },
  comments: 0,
  labels: [],
  html_url: "https://github.com/org/repo/pull/12",
};

describe("usePullRequestStore", () => {
  beforeEach(() => {
    usePullRequestStore.setState({
      selectedPr: null,
      selectedRepoPath: null,
      isDrawerOpen: false,
    });
  });

  it("sets and clears selectedPr via setSelectedPr", () => {
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    expect(usePullRequestStore.getState().selectedRepoPath).toBeNull();

    usePullRequestStore.getState().setSelectedPr(dummyPr, "/repo/a");
    expect(usePullRequestStore.getState().selectedPr).toEqual(dummyPr);
    expect(usePullRequestStore.getState().selectedRepoPath).toBe("/repo/a");

    usePullRequestStore.getState().setSelectedPr(null);
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    expect(usePullRequestStore.getState().selectedRepoPath).toBeNull();
  });

  it("sets and clears selectedRepoPath via openDrawer and closeDrawer", () => {
    usePullRequestStore.getState().openDrawer(dummyPr, "/repo/b");
    expect(usePullRequestStore.getState().isDrawerOpen).toBe(true);
    expect(usePullRequestStore.getState().selectedPr).toEqual(dummyPr);
    expect(usePullRequestStore.getState().selectedRepoPath).toBe("/repo/b");

    usePullRequestStore.getState().closeDrawer();
    expect(usePullRequestStore.getState().isDrawerOpen).toBe(false);
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    expect(usePullRequestStore.getState().selectedRepoPath).toBeNull();
  });
});
