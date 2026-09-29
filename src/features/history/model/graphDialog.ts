import type { GraphCommitNode } from "../../../ipc/bindings.generated";

export type GraphDialog =
  | { type: "closed" }
  | { type: "createTag"; commit: GraphCommitNode }
  | { type: "createBranch"; commit: GraphCommitNode }
  | { type: "cherryPick"; commit: GraphCommitNode }
  | { type: "revert"; commit: GraphCommitNode }
  | { type: "interactiveRebase"; commit: GraphCommitNode }
  | { type: "compare"; baseRev: string; targetRev: string };

export type GraphContextMenu = { x: number; y: number; commit: GraphCommitNode };

/**
 * "Compare with..." from the graph context menu: compares the already
 * selected commit against the right-clicked one, falling back to comparing
 * the right-clicked commit against HEAD when nothing else is selected (or
 * the right-clicked commit itself is the selection).
 */
export function buildCompareDialogFromContextMenu(
  contextMenu: GraphContextMenu,
  selectedCommitId: string | null
): Extract<GraphDialog, { type: "compare" }> {
  const hasOtherSelection = Boolean(
    selectedCommitId && selectedCommitId !== contextMenu.commit.id
  );
  return {
    type: "compare",
    baseRev: hasOtherSelection ? selectedCommitId! : contextMenu.commit.id,
    targetRev: hasOtherSelection ? contextMenu.commit.id : "HEAD",
  };
}
