import { describe, it, expect } from "vitest";
import { filterBranchesByName } from "../features/branch/model/branchFilter";
import { type BranchItem } from "../ipc/bindings.generated";

function branch(name: string): BranchItem {
  return {
    name,
    is_head: false,
    target_commit_id: "c1",
    upstream: null,
    ahead: 0,
    behind: 0,
  };
}

describe("filterBranchesByName", () => {
  it("keeps branches whose name contains the search text", () => {
    const branches = [branch("main"), branch("feature/login"), branch("release/1.0")];
    expect(filterBranchesByName(branches, "feature").map((b) => b.name)).toEqual([
      "feature/login",
    ]);
  });

  it("is case-insensitive", () => {
    const branches = [branch("Feature/Login")];
    expect(filterBranchesByName(branches, "login").map((b) => b.name)).toEqual([
      "Feature/Login",
    ]);
  });

  it("returns every branch when the search is empty", () => {
    const branches = [branch("main"), branch("develop")];
    expect(filterBranchesByName(branches, "")).toEqual(branches);
  });

  it("returns nothing when no branch matches", () => {
    const branches = [branch("main")];
    expect(filterBranchesByName(branches, "nope")).toEqual([]);
  });
});
