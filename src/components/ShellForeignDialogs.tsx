import React from "react";
import { isDialog, type SidebarDialog } from "../features/branch";
import { CreateTagModal, DeleteTagModal } from "../features/tag";
import {
  AddEditRemoteModal,
  DeleteRemoteModal,
  ManageRemotesModal,
  PruneConfirmModal,
} from "../features/remote";
import { type BranchListResult } from "../ipc/bindings.generated";

interface ShellForeignDialogsProps {
  dialog: SidebarDialog;
  closeDialog: () => void;
  repoPath: string;
  branchData: BranchListResult | undefined;
  invalidateRepo: () => void;
  invalidateRemotes: () => void;
}

/**
 * The tag and remote dialogs BranchSidebar delegates up to the Shell (Phase 5
 * convention: the feature decides *when*, the Shell provides *what*).
 */
export const ShellForeignDialogs: React.FC<ShellForeignDialogsProps> = ({
  dialog,
  closeDialog,
  repoPath,
  branchData,
  invalidateRepo,
  invalidateRemotes,
}) => {
  return (
    <>
      {isDialog(dialog, "createTag") && (
        <CreateTagModal
          isOpen
          onClose={closeDialog}
          repoPath={repoPath}
          targetCommitId={dialog.commitId}
          targetCommitSummary={dialog.summary}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "deleteTag") && (
        <DeleteTagModal
          isOpen
          onClose={closeDialog}
          repoPath={repoPath}
          tagName={dialog.tag.name}
          targetCommitId={dialog.tag.target_commit_id}
          hasRemote={Boolean(branchData?.remote && branchData.remote.length > 0)}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "manageRemotes") && (
        <ManageRemotesModal isOpen onClose={closeDialog} repoPath={repoPath} />
      )}

      {(isDialog(dialog, "addRemote") || isDialog(dialog, "editRemote")) && (
        <AddEditRemoteModal
          isOpen
          onClose={closeDialog}
          repoPath={repoPath}
          initialRemote={isDialog(dialog, "editRemote") ? dialog.remote : null}
          onSuccess={invalidateRemotes}
        />
      )}

      {isDialog(dialog, "pruneRemote") && (
        <PruneConfirmModal
          isOpen
          onClose={closeDialog}
          repoPath={repoPath}
          remoteName={dialog.remoteName}
          onSuccess={invalidateRemotes}
        />
      )}

      {isDialog(dialog, "deleteRemote") && (
        <DeleteRemoteModal
          isOpen
          onClose={closeDialog}
          repoPath={repoPath}
          remote={dialog.remote}
          onSuccess={invalidateRemotes}
        />
      )}
    </>
  );
};
