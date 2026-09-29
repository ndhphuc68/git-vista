/**
 * The merge/rebase/compare dialogs and the foreign dialog slot Shell
 * supplies. Split out of BranchSidebarDialogs to keep that component's own
 * function under the line limit.
 */
import React from "react";
import { type BranchItem, type TagItem } from "../../../ipc/bindings.generated";
import { isDialog, type SidebarDialog } from "../model/sidebarDialog";
import type { useSidebarActions } from "../hooks/useSidebarActions";
import { MergeBranchModal } from "../../../components/merge/MergeBranchModal";
import { RebaseBranchModal } from "../../../components/merge/RebaseBranchModal";
import { CompareModal } from "../../../components/compare";

export interface BranchSidebarMergeDialogsProps {
  dialog: SidebarDialog;
  closeDialog: () => void;
  repoPath: string;
  currentBranchName: string;
  hasUncommittedChanges: boolean;
  localBranches?: BranchItem[];
  tagItems: TagItem[];
  onMerge: ReturnType<typeof useSidebarActions>["mergeBranch"];
  onRebase: ReturnType<typeof useSidebarActions>["rebaseBranch"];
  renderForeignDialog?: (dialog: SidebarDialog, close: () => void) => React.ReactNode;
}

export const BranchSidebarMergeDialogs: React.FC<BranchSidebarMergeDialogsProps> = ({
  dialog,
  closeDialog,
  repoPath,
  currentBranchName,
  hasUncommittedChanges,
  localBranches,
  tagItems,
  onMerge,
  onRebase,
  renderForeignDialog,
}) => (
  <>
    {isDialog(dialog, "merge") && (
      <MergeBranchModal
        isOpen={true}
        onClose={closeDialog}
        currentBranch={currentBranchName}
        targetBranch={dialog.targetBranch}
        hasUncommittedChanges={hasUncommittedChanges}
        onMerge={(noFf) => onMerge(dialog.targetBranch, noFf)}
      />
    )}

    {isDialog(dialog, "rebase") && (
      <RebaseBranchModal
        isOpen={true}
        onClose={closeDialog}
        currentBranch={currentBranchName}
        upstreamBranch={dialog.upstreamBranch}
        hasUncommittedChanges={hasUncommittedChanges}
        onRebase={() => onRebase(dialog.upstreamBranch)}
      />
    )}

    {isDialog(dialog, "compare") && (
      <CompareModal
        isOpen
        onClose={closeDialog}
        repoPath={repoPath}
        initialBaseRev={dialog.baseRev}
        initialTargetRev={dialog.targetRev}
        branches={localBranches}
        tags={tagItems}
      />
    )}

    {renderForeignDialog?.(dialog, closeDialog)}
  </>
);
