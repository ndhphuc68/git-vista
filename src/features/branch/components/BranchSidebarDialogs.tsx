/**
 * The sidebar's dialog slot: at most one of these renders at a time, chosen
 * by `dialog.kind`. Split out of BranchSidebar to keep that component's own
 * function under the line limit.
 */
import React from "react";
import { type BranchItem, type TagItem } from "../../../ipc/bindings.generated";
import { isDialog, type SidebarDialog } from "../model/sidebarDialog";
import type { useSidebarActions } from "../hooks/useSidebarActions";
// Sibling modules directly, not through ../index — the barrel re-exports
// BranchSidebar, so going through it would create an import cycle.
import { CreateBranchModal } from "./CreateBranchModal";
import { RenameBranchModal } from "./RenameBranchModal";
import { DeleteBranchModal } from "./DeleteBranchModal";
import { CheckoutConflictModal } from "./CheckoutConflictModal";
import { BranchSidebarMergeDialogs } from "./BranchSidebarMergeDialogs";

export interface BranchSidebarDialogsProps {
  dialog: SidebarDialog;
  closeDialog: () => void;
  repoPath: string;
  invalidateRepo: () => void;
  currentBranchName: string;
  hasUncommittedChanges: boolean;
  localBranches?: BranchItem[];
  tagItems: TagItem[];
  onMerge: ReturnType<typeof useSidebarActions>["mergeBranch"];
  onRebase: ReturnType<typeof useSidebarActions>["rebaseBranch"];
  onNavigateToChanges: () => void;
  renderForeignDialog?: (dialog: SidebarDialog, close: () => void) => React.ReactNode;
}

export const BranchSidebarDialogs: React.FC<BranchSidebarDialogsProps> = ({
  dialog,
  closeDialog,
  repoPath,
  invalidateRepo,
  currentBranchName,
  hasUncommittedChanges,
  localBranches,
  tagItems,
  onMerge,
  onRebase,
  onNavigateToChanges,
  renderForeignDialog,
}) => (
  <>
    {isDialog(dialog, "createBranch") && (
      <CreateBranchModal
        isOpen
        onClose={closeDialog}
        repoPath={repoPath}
        targetCommit={dialog.fromRef}
        onSuccess={invalidateRepo}
      />
    )}

    {isDialog(dialog, "renameBranch") && (
      <RenameBranchModal
        isOpen
        onClose={closeDialog}
        repoPath={repoPath}
        currentName={dialog.name}
        onSuccess={invalidateRepo}
      />
    )}

    {isDialog(dialog, "deleteBranch") && (
      <DeleteBranchModal
        isOpen
        onClose={closeDialog}
        repoPath={repoPath}
        branchName={dialog.name}
        onSuccess={invalidateRepo}
      />
    )}

    {isDialog(dialog, "checkoutConflict") && (
      <CheckoutConflictModal
        isOpen
        onClose={closeDialog}
        repoPath={repoPath}
        targetBranch={dialog.targetBranch}
        errorMessage={dialog.errorMessage}
        onNavigateToChanges={onNavigateToChanges}
        onSuccess={invalidateRepo}
      />
    )}

    <BranchSidebarMergeDialogs
      dialog={dialog}
      closeDialog={closeDialog}
      repoPath={repoPath}
      currentBranchName={currentBranchName}
      hasUncommittedChanges={hasUncommittedChanges}
      localBranches={localBranches}
      tagItems={tagItems}
      onMerge={onMerge}
      onRebase={onRebase}
      renderForeignDialog={renderForeignDialog}
    />
  </>
);
