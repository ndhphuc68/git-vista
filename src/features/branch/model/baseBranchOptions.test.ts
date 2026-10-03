import { describe, it, expect } from "vitest";
import type { BranchItem } from "../../../ipc/bindings.generated";
import { baseBranchFallbackLabel, buildBaseBranchSections } from "./baseBranchOptions";

const branch = (name: string, is_head = false): BranchItem => ({
  name,
  is_head,
  target_commit_id: "c1",
  upstream: null,
  ahead: 0,
  behind: 0,
});

const local = [branch("main", true), branch("feature/x")];
const remote = [branch("origin/dev")];

describe("buildBaseBranchSections", () => {
  it("maps the current branch to HEAD ('') when no target commit is given", () => {
    const sections = buildBaseBranchSections({
      value: "",
      localBranches: local,
      remoteBranches: remote,
    });

    expect(sections.map((s) => s.kind)).toEqual(["local", "remote"]);
    expect(sections[0]!.entries).toEqual([
      { value: "", label: "main", isHead: true },
      { value: "refs/heads/feature/x", label: "feature/x", isHead: false },
    ]);
    expect(sections[1]!.entries).toEqual([
      { value: "refs/remotes/origin/dev", label: "origin/dev", isHead: false },
    ]);
  });

  it("puts the commit first and uses full refs for every branch when targeting a commit", () => {
    const sections = buildBaseBranchSections({
      value: "abcdef1234567",
      isCommitTarget: true,
      targetCommit: "abcdef1234567",
      localBranches: local,
      remoteBranches: [],
    });

    expect(sections.map((s) => s.kind)).toEqual(["commit", "local"]);
    expect(sections[0]!.entries).toEqual([
      { value: "abcdef1234567", label: "abcdef1", isHead: false },
    ]);
    expect(sections[1]!.entries[0]).toEqual({
      value: "refs/heads/main",
      label: "main",
      isHead: true,
    });
  });

  it("treats currentBranchName as HEAD even without the is_head flag", () => {
    const sections = buildBaseBranchSections({
      value: "",
      localBranches: [branch("dev")],
      remoteBranches: [],
      currentBranchName: "dev",
    });
    expect(sections[0]!.entries[0]).toEqual({ value: "", label: "dev", isHead: true });
  });

  it("omits empty sections", () => {
    expect(buildBaseBranchSections({ value: "", localBranches: [], remoteBranches: [] })).toEqual(
      []
    );
  });
});

describe("baseBranchFallbackLabel", () => {
  const empty = { localBranches: [], remoteBranches: [] };

  it("strips ref prefixes from the value", () => {
    expect(baseBranchFallbackLabel({ ...empty, value: "refs/heads/a" })).toBe("a");
    expect(baseBranchFallbackLabel({ ...empty, value: "refs/remotes/origin/b" })).toBe("origin/b");
  });

  it("shortens the target commit", () => {
    expect(
      baseBranchFallbackLabel({ ...empty, value: "abcdef1234", targetCommit: "abcdef1234" })
    ).toBe("abcdef1");
    expect(
      baseBranchFallbackLabel({
        ...empty,
        value: "",
        isCommitTarget: true,
        targetCommit: "abcdef1234",
      })
    ).toBe("abcdef1");
  });

  it("falls back to the source branch, then the current branch, then HEAD", () => {
    expect(baseBranchFallbackLabel({ ...empty, value: "", sourceBranch: "origin/x" })).toBe(
      "origin/x"
    );
    expect(baseBranchFallbackLabel({ ...empty, value: "", currentBranchName: "main" })).toBe(
      "main"
    );
    expect(baseBranchFallbackLabel({ ...empty, value: "" })).toBe("HEAD");
  });
});
