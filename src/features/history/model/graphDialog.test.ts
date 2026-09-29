import { describe, it, expect } from "vitest";
import { buildCompareDialogFromContextMenu, type GraphContextMenu } from "./graphDialog";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";

function makeContextMenu(commitId: string): GraphContextMenu {
  const commit: GraphCommitNode = {
    id: commitId,
    short_id: commitId.slice(0, 7),
    summary: "summary",
    author_name: "Author",
    author_email: "author@example.com",
    timestamp_sec: 0,
    parent_ids: [],
    col: 0,
    color_index: 0,
    lines: [],
    refs: [],
  };
  return { x: 0, y: 0, commit };
}

describe("buildCompareDialogFromContextMenu", () => {
  it("compares the selected commit against the right-clicked one when a different commit is selected", () => {
    const dialog = buildCompareDialogFromContextMenu(makeContextMenu("target-id"), "selected-id");
    expect(dialog).toEqual({ type: "compare", baseRev: "selected-id", targetRev: "target-id" });
  });

  it("falls back to comparing the right-clicked commit against HEAD when nothing else is selected", () => {
    const dialog = buildCompareDialogFromContextMenu(makeContextMenu("target-id"), null);
    expect(dialog).toEqual({ type: "compare", baseRev: "target-id", targetRev: "HEAD" });
  });

  it("falls back to HEAD when the right-clicked commit is itself the selection", () => {
    const dialog = buildCompareDialogFromContextMenu(makeContextMenu("same-id"), "same-id");
    expect(dialog).toEqual({ type: "compare", baseRev: "same-id", targetRev: "HEAD" });
  });
});
