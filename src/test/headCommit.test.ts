import { describe, it, expect } from "vitest";
import { findHeadCommitId } from "../features/branch/model/headCommit";
import { type BranchItem } from "../ipc/bindings.generated";

function branch(name: string, isHead: boolean, commitId: string): BranchItem {
  return { name, is_head: isHead, target_commit_id: commitId, upstream: null, ahead: 0, behind: 0 };
}

describe("findHeadCommitId", () => {
  it("returns the HEAD branch's commit when one is flagged", () => {
    const branches = [branch("feature", false, "c1"), branch("main", true, "c2")];
    expect(findHeadCommitId(branches)).toBe("c2");
  });

  it("falls back to the first branch's commit when none is HEAD", () => {
    const branches = [branch("feature", false, "c1"), branch("main", false, "c2")];
    expect(findHeadCommitId(branches)).toBe("c1");
  });

  it("returns an empty string when there are no branches", () => {
    expect(findHeadCommitId([])).toBe("");
  });
});
