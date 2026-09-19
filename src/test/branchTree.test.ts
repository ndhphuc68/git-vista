import { describe, it, expect } from "vitest";
import { buildBranchTree, countBranchesInNode } from "../features/branch/model/branchTree";
import { type BranchItem } from "../ipc/bindings.generated";

function branch(name: string, isHead = false): BranchItem {
  return {
    name,
    is_head: isHead,
    target_commit_id: "abc1234",
    upstream: null,
    ahead: 0,
    behind: 0,
  };
}

describe("buildBranchTree", () => {
  it("keeps a flat branch at the root", () => {
    const tree = buildBranchTree([branch("main")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.isFolder).toBe(false);
    expect(tree[0]!.name).toBe("main");
    expect(tree[0]!.fullPath).toBe("main");
  });

  it("nests a slash-separated branch under a folder", () => {
    const tree = buildBranchTree([branch("feature/login")]);

    expect(tree).toHaveLength(1);
    const folder = tree[0]!;
    expect(folder.isFolder).toBe(true);
    expect(folder.name).toBe("feature");
    expect(folder.children).toHaveLength(1);
    expect(folder.children[0]!.name).toBe("login");
    // The leaf keeps the full branch name, which is what checkout needs.
    expect(folder.children[0]!.fullPath).toBe("feature/login");
  });

  it("groups branches that share a folder prefix", () => {
    const tree = buildBranchTree([branch("feature/a"), branch("feature/b")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.children.map((c) => c.name)).toEqual(["a", "b"]);
  });

  it("builds nested folders for multi-level names", () => {
    const tree = buildBranchTree([branch("team/web/login")]);

    const team = tree[0]!;
    expect(team.name).toBe("team");
    const web = team.children[0]!;
    expect(web.isFolder).toBe(true);
    expect(web.name).toBe("web");
    expect(web.fullPath).toBe("team/web");
    expect(web.children[0]!.fullPath).toBe("team/web/login");
  });

  it("returns an empty tree for no branches", () => {
    expect(buildBranchTree([])).toEqual([]);
  });
});

describe("countBranchesInNode", () => {
  it("counts a leaf as one", () => {
    const tree = buildBranchTree([branch("main")]);
    expect(countBranchesInNode(tree[0]!)).toBe(1);
  });

  it("counts every leaf beneath a folder", () => {
    const tree = buildBranchTree([branch("feature/a"), branch("feature/b")]);
    expect(countBranchesInNode(tree[0]!)).toBe(2);
  });

  it("counts across nested folders", () => {
    const tree = buildBranchTree([branch("team/web/a"), branch("team/api/b"), branch("team/api/c")]);
    expect(countBranchesInNode(tree[0]!)).toBe(3);
  });
});
