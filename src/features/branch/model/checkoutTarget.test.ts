import { describe, expect, it } from "vitest";
import { type BranchItem, type BranchListResult } from "../../../ipc/bindings.generated";
import { checkedOutBranchName, commitsBehindRemote } from "./checkoutTarget";

function item(name: string): BranchItem {
  return { name, is_head: false, target_commit_id: "abc", upstream: null, ahead: 0, behind: 0 };
}

function branches(local: string[], remote: string[]): BranchListResult {
  return {
    current_branch: "main",
    is_detached: false,
    local: local.map(item),
    remote: remote.map(item),
    tags: [],
  };
}

describe("checkedOutBranchName", () => {
  it("keeps a local branch name as is", () => {
    const data = branches(["main", "feature/login"], ["origin/main"]);
    expect(checkedOutBranchName("feature/login", data)).toBe("feature/login");
  });

  it("strips the remote prefix from a remote-tracking branch", () => {
    const data = branches(["main"], ["origin/feature/login"]);
    expect(checkedOutBranchName("origin/feature/login", data)).toBe("feature/login");
  });

  it("prefers a local branch whose name looks like a remote-tracking name", () => {
    const data = branches(["origin/feature"], ["origin/feature"]);
    expect(checkedOutBranchName("origin/feature", data)).toBe("origin/feature");
  });

  it("returns the name unchanged while branch data is not loaded", () => {
    expect(checkedOutBranchName("origin/feature", undefined)).toBe("origin/feature");
  });
});

describe("commitsBehindRemote", () => {
  function withLocal(local: Partial<BranchItem> & { name: string }): BranchListResult {
    const data = branches([], ["origin/feature"]);
    return { ...data, local: [{ ...item(local.name), ...local }] };
  }

  it("reports how far the local branch tracking the remote lags behind", () => {
    const data = withLocal({ name: "feature", upstream: "origin/feature", behind: 3 });
    expect(commitsBehindRemote("origin/feature", data)).toBe(3);
  });

  it("ignores a local branch that tracks a different upstream", () => {
    const data = withLocal({ name: "feature", upstream: "fork/feature", behind: 3 });
    expect(commitsBehindRemote("origin/feature", data)).toBe(0);
  });

  it("is 0 when the requested name is itself a local branch", () => {
    const data = withLocal({ name: "origin/feature", upstream: "origin/feature", behind: 2 });
    expect(commitsBehindRemote("origin/feature", data)).toBe(0);
  });

  it("is 0 while branch data is not loaded", () => {
    expect(commitsBehindRemote("origin/feature", undefined)).toBe(0);
  });
});
