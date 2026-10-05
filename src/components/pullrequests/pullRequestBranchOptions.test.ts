import { describe, it, expect } from "vitest";
import {
  findCurrentCompareBranchItem,
  hasUnpushedCommits,
  getAvailableBaseBranches,
  getAvailableCompareBranches,
} from "./pullRequestBranchOptions";
import {
  type BranchListResult,
  type BranchItem,
  type GitHubRepoInfo,
} from "../../ipc/bindings.generated";

function makeBranchItem(overrides: Partial<BranchItem> = {}): BranchItem {
  return {
    name: "feature",
    is_head: false,
    target_commit_id: "c1",
    upstream: "origin/feature",
    ahead: 0,
    behind: 0,
    ...overrides,
  };
}

function makeBranchData(overrides: Partial<BranchListResult> = {}): BranchListResult {
  return {
    current_branch: "feature",
    is_detached: false,
    local: [],
    remote: [],
    tags: [],
    ...overrides,
  };
}

describe("findCurrentCompareBranchItem", () => {
  it("returns the local branch matching the compare branch name", () => {
    const item = makeBranchItem({ name: "feature" });
    const branchData = makeBranchData({ local: [item] });
    expect(findCurrentCompareBranchItem(branchData, "feature")).toBe(item);
  });

  it("returns undefined when there is no matching branch", () => {
    expect(findCurrentCompareBranchItem(makeBranchData(), "feature")).toBeUndefined();
  });

  it("returns undefined when branchData is undefined", () => {
    expect(findCurrentCompareBranchItem(undefined, "feature")).toBeUndefined();
  });
});

describe("hasUnpushedCommits", () => {
  it("is true when the branch is ahead of its upstream", () => {
    expect(hasUnpushedCommits(makeBranchItem({ ahead: 2 }))).toBe(true);
  });

  it("is true when the branch has no upstream", () => {
    expect(hasUnpushedCommits(makeBranchItem({ upstream: null }))).toBe(true);
  });

  it("is false when the branch is up to date with its upstream", () => {
    expect(hasUnpushedCommits(makeBranchItem({ ahead: 0, upstream: "origin/feature" }))).toBe(
      false
    );
  });

  it("is false when there is no branch item", () => {
    expect(hasUnpushedCommits(undefined)).toBe(false);
  });
});

describe("getAvailableBaseBranches", () => {
  it("dedupes the default branch, remote branches (stripped of origin/), and local branches", () => {
    const repoInfo = {
      is_github: true,
      owner: "o",
      repo: "r",
      default_branch: "main",
    } as GitHubRepoInfo;
    const branchData = makeBranchData({
      remote: [makeBranchItem({ name: "origin/main" }), makeBranchItem({ name: "origin/dev" })],
      local: [makeBranchItem({ name: "main" }), makeBranchItem({ name: "feature" })],
    });
    expect(getAvailableBaseBranches(repoInfo, branchData)).toEqual(["main", "dev", "feature"]);
  });

  it("falls back to main when there is no repo info", () => {
    expect(getAvailableBaseBranches(undefined, undefined)).toEqual(["main"]);
  });
});

describe("getAvailableCompareBranches", () => {
  it("returns local branch names", () => {
    const branchData = makeBranchData({
      local: [makeBranchItem({ name: "main" }), makeBranchItem({ name: "feature" })],
    });
    expect(getAvailableCompareBranches(branchData, "feature")).toEqual(["main", "feature"]);
  });

  it("falls back to the current compare branch when there is no branch data", () => {
    expect(getAvailableCompareBranches(undefined, "feature")).toEqual(["feature"]);
  });
});
