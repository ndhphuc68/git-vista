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
    usePullRequestStore.setState({ selectedPr: null });
  });

  it("sets and clears selectedPr via setSelectedPr", () => {
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    usePullRequestStore.getState().setSelectedPr(dummyPr);
    expect(usePullRequestStore.getState().selectedPr).toEqual(dummyPr);
    usePullRequestStore.getState().setSelectedPr(null);
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
  });
});
