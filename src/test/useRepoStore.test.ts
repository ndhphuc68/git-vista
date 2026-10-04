import { describe, it, expect, beforeEach } from "vitest";
import { useRepoStore } from "../store/useRepoStore";
import { usePullRequestStore } from "../store/usePullRequestStore";
import { type GitHubPullRequest } from "../ipc/githubApi";

const dummyPr: GitHubPullRequest = {
  number: 1,
  title: "PR 1",
  state: "open",
  draft: false,
  user: { login: "a", avatar_url: "", html_url: "" },
  created_at: "",
  updated_at: "",
  head: { ref: "", sha: "" },
  base: { ref: "", sha: "" },
  comments: 0,
  labels: [],
  html_url: "",
};

describe("useRepoStore", () => {
  beforeEach(() => {
    useRepoStore.getState().clearRepo();
  });

  it("should initialize with null state", () => {
    const state = useRepoStore.getState();
    expect(state.currentRepo).toBeNull();
    expect(state.selectedCommitId).toBeNull();
    expect(state.selectedFilePath).toBeNull();
  });

  it("should update repo and reset selections", () => {
    useRepoStore.getState().setRepo({
      path: "/test/repo",
      name: "repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc1234",
    });

    useRepoStore.getState().setSelectedCommit("c1");
    useRepoStore.getState().setSelectedFile("file.txt");

    expect(useRepoStore.getState().selectedCommitId).toBe("c1");
    expect(useRepoStore.getState().selectedFilePath).toBe("file.txt");

    useRepoStore.getState().clearRepo();
    expect(useRepoStore.getState().currentRepo).toBeNull();
    expect(useRepoStore.getState().selectedCommitId).toBeNull();
  });

  it("resets pull request selection and closes drawer on setRepo and clearRepo", () => {
    usePullRequestStore.getState().openDrawer(dummyPr, "/old/repo");
    expect(usePullRequestStore.getState().isDrawerOpen).toBe(true);
    expect(usePullRequestStore.getState().selectedPr).toEqual(dummyPr);

    useRepoStore.getState().setRepo({
      path: "/new/repo",
      name: "new-repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "abc",
    });

    expect(usePullRequestStore.getState().isDrawerOpen).toBe(false);
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    expect(usePullRequestStore.getState().selectedRepoPath).toBe("/new/repo");

    usePullRequestStore.getState().openDrawer(dummyPr, "/new/repo");
    useRepoStore.getState().clearRepo();

    expect(usePullRequestStore.getState().isDrawerOpen).toBe(false);
    expect(usePullRequestStore.getState().selectedPr).toBeNull();
    expect(usePullRequestStore.getState().selectedRepoPath).toBeNull();
  });
});
