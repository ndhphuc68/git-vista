/**
 * Every dialog the branch sidebar can open, as one discriminated union.
 *
 * The sidebar used twelve independent useState flags for this, which allowed
 * meaningless states such as two dialogs open at once. A union makes those
 * states unrepresentable: a value has exactly one kind, and each kind carries
 * exactly the payload its dialog needs.
 *
 * Adding a dialog means adding one branch here — TypeScript then forces every
 * exhaustive switch to handle it.
 */
import { type TagItem, type RemoteItem } from "../../../ipc/bindings.generated";

export type SidebarDialog =
  | { kind: "none" }
  | { kind: "createBranch"; fromRef: string | null }
  | { kind: "renameBranch"; name: string }
  | { kind: "deleteBranch"; name: string }
  | { kind: "createTag"; commitId: string; summary?: string }
  | { kind: "deleteTag"; tag: TagItem }
  | { kind: "merge"; targetBranch: string }
  | { kind: "rebase"; upstreamBranch: string }
  | { kind: "compare"; baseRev: string; targetRev: string }
  | { kind: "checkoutConflict"; targetBranch: string; errorMessage: string }
  | { kind: "manageRemotes" }
  | { kind: "addRemote" }
  | { kind: "editRemote"; remote: RemoteItem }
  | { kind: "deleteRemote"; remote: RemoteItem }
  | { kind: "pruneRemote"; remoteName: string };

/** The closed state. Shared so call sites don't re-spell the literal. */
export const NO_DIALOG: SidebarDialog = { kind: "none" };

/** Narrows a dialog to one variant, for use in render guards. */
export function isDialog<K extends SidebarDialog["kind"]>(
  dialog: SidebarDialog,
  kind: K
): dialog is Extract<SidebarDialog, { kind: K }> {
  return dialog.kind === kind;
}
