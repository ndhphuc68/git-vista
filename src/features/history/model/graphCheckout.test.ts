import { describe, expect, it } from "vitest";
import { type GraphCommitNode } from "../../../ipc/bindings.generated";
import { graphCheckedOutBranchName } from "./graphCheckout";

function commitWithRefs(refs: GraphCommitNode["refs"]): Pick<GraphCommitNode, "refs"> {
  return { refs };
}

describe("graphCheckedOutBranchName", () => {
  it("keeps a local branch name as is", () => {
    const commits = [commitWithRefs([{ name: "feature/login", ref_type: "local" }])];
    expect(graphCheckedOutBranchName("feature/login", commits)).toBe("feature/login");
  });

  it("strips the remote prefix from a remote-tracking branch", () => {
    const commits = [commitWithRefs([{ name: "origin/feature/login", ref_type: "remote" }])];
    expect(graphCheckedOutBranchName("origin/feature/login", commits)).toBe("feature/login");
  });

  it("prefers a local branch whose name looks like a remote-tracking name", () => {
    const commits = [
      commitWithRefs([{ name: "origin/feature", ref_type: "remote" }]),
      commitWithRefs([{ name: "origin/feature", ref_type: "local" }]),
    ];
    expect(graphCheckedOutBranchName("origin/feature", commits)).toBe("origin/feature");
  });

  it("returns the name unchanged when no loaded ref matches it", () => {
    expect(graphCheckedOutBranchName("origin/feature", [])).toBe("origin/feature");
  });
});
