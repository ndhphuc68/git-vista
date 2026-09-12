import { describe, it, expect, beforeEach } from "vitest";
import { useRepoStore } from "../store/useRepoStore";

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
});
