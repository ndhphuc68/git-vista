import type { ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { CherryPickModal } from "../../../components/modals/CherryPickModal";
import { RevertModal } from "../../../components/modals/RevertModal";
import { InteractiveRebaseModal } from "../../../components/rebase";
import { CompareModal } from "../../../components/compare";
import { useUndoGraphCommit } from "../api/useCommitGraph";
import type { GraphDialog } from "../model/graphDialog";

interface GraphActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  onSuccess: () => void;
}

/** Shell supplies dialogs owned by other features; history owns their state. */
export interface GraphDialogComponents {
  CreateTagModal: ComponentType<
    GraphActionModalProps & {
      targetCommitId: string;
      targetCommitSummary: string;
    }
  >;
  CreateBranchModal: ComponentType<GraphActionModalProps & { targetCommit: string }>;
}

interface CommitGraphDialogsProps extends GraphDialogComponents {
  dialog: GraphDialog;
  onClose: () => void;
}

export function CommitGraphDialogs({
  dialog,
  onClose,
  CreateTagModal,
  CreateBranchModal,
}: CommitGraphDialogsProps) {
  const { currentRepo } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const undoCommit = useUndoGraphCommit(currentRepo?.path ?? "");
  if (!currentRepo) return null;

  return (
    <>
      {dialog.type === "createTag" && (
        <CreateTagModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          targetCommitId={dialog.commit.id}
          targetCommitSummary={dialog.commit.summary}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.tags(currentRepo.path) });
          }}
        />
      )}

      {dialog.type === "createBranch" && (
        <CreateBranchModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          targetCommit={dialog.commit.id}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
          }}
        />
      )}

      {dialog.type === "cherryPick" && (
        <CherryPickModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          currentBranch={currentRepo.head_branch ?? "main"}
          targetCommit={{
            id: dialog.commit.id,
            short_id: dialog.commit.short_id,
            summary: dialog.commit.summary,
            author: dialog.commit.author_name,
          }}
          onSuccess={(result) => {
            onClose();
            if (result.status === "Committed") {
              queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.head(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
              const undoToken = result.undo_token;
              useToastStore.getState().showSuccess(
                t.modals.cherryPick.successToast
                  .replace("{sha}", dialog.commit.short_id)
                  .replace("{commit}", dialog.commit.short_id),
                undoToken
                  ? async () => {
                      await undoCommit(undoToken);
                    }
                  : undefined,
                t.common.undo
              );
            } else if (result.status === "Staged") {
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              useToastStore.getState().showToast({
                message: t.modals.cherryPick.stagedToast,
                type: "info",
              });
              setActiveScreen("changes");
            } else if (result.status === "Conflict") {
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.state(currentRepo.path) });
              useToastStore.getState().showToast({
                message: t.modals.cherryPick.conflictToast,
                type: "error",
              });
              setActiveScreen("changes");
            }
          }}
        />
      )}

      {dialog.type === "revert" && (
        <RevertModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          targetCommit={{
            id: dialog.commit.id,
            short_id: dialog.commit.short_id,
            summary: dialog.commit.summary,
            author: dialog.commit.author_name,
          }}
          onSuccess={(result) => {
            onClose();
            if (result.status === "Committed") {
              queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.head(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
              const undoToken = result.undo_token;
              useToastStore.getState().showSuccess(
                t.modals.revert.successToast
                  .replace("{sha}", dialog.commit.short_id)
                  .replace("{commit}", dialog.commit.short_id),
                undoToken
                  ? async () => {
                      await undoCommit(undoToken);
                    }
                  : undefined,
                t.common.undo
              );
            } else if (result.status === "Staged") {
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              useToastStore.getState().showToast({
                message: t.modals.revert.stagedToast,
                type: "info",
              });
              setActiveScreen("changes");
            } else if (result.status === "Conflict") {
              queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
              queryClient.invalidateQueries({ queryKey: qk.repo.state(currentRepo.path) });
              useToastStore.getState().showToast({
                message: t.modals.revert.conflictToast,
                type: "error",
              });
              setActiveScreen("changes");
            }
          }}
        />
      )}

      {dialog.type === "interactiveRebase" && (
        <InteractiveRebaseModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          baseCommitId={dialog.commit.id}
          baseCommitSummary={dialog.commit.summary}
          onRebaseSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.repo.head(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
          }}
        />
      )}

      {dialog.type === "compare" && (
        <CompareModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          initialBaseRev={dialog.baseRev}
          initialTargetRev={dialog.targetRev}
        />
      )}
    </>
  );
}
