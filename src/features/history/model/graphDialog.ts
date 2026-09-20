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
