import type { QueryClient } from "@tanstack/react-query";
import type { useTranslation } from "../../../i18n";
import { CherryPickModal } from "./CherryPickModal";
import { RevertModal } from "./RevertModal";
import type { GraphDialog } from "../model/graphDialog";
import { createCommitActionSuccessHandler } from "./CommitGraphDialogs.actions";

interface CommitGraphUndoableDialogsProps {
  dialog: GraphDialog;
  onClose: () => void;
  repoPath: string;
  currentBranch: string;
  t: ReturnType<typeof useTranslation>["t"];
  queryClient: QueryClient;
  setActiveScreen: (screen: "changes") => void;
  undoCommit: (undoToken: string) => Promise<void>;
}

/** Cherry-pick and revert dialogs: same target-commit shape, same result handling. */
export function CommitGraphUndoableDialogs({
  dialog,
  onClose,
  repoPath,
  currentBranch,
  t,
  queryClient,
  setActiveScreen,
  undoCommit,
}: CommitGraphUndoableDialogsProps) {
  return (
    <>
      {dialog.type === "cherryPick" && (
        <CherryPickModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={repoPath}
          currentBranch={currentBranch}
          targetCommit={{
            id: dialog.commit.id,
            short_id: dialog.commit.short_id,
            summary: dialog.commit.summary,
            author: dialog.commit.author_name,
          }}
          onSuccess={(result) =>
            createCommitActionSuccessHandler({
              queryClient,
              repoPath,
              onClose,
              setActiveScreen,
              undoCommit,
              messages: {
                successToast: (shortId) =>
                  t.modals.cherryPick.successToast
                    .replace("{sha}", shortId)
                    .replace("{commit}", shortId),
                stagedToast: t.modals.cherryPick.stagedToast,
                conflictToast: t.modals.cherryPick.conflictToast,
                undoLabel: t.common.undo,
              },
            })(result, dialog.commit.short_id)
          }
        />
      )}

      {dialog.type === "revert" && (
        <RevertModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={repoPath}
          targetCommit={{
            id: dialog.commit.id,
            short_id: dialog.commit.short_id,
            summary: dialog.commit.summary,
            author: dialog.commit.author_name,
          }}
          onSuccess={(result) =>
            createCommitActionSuccessHandler({
              queryClient,
              repoPath,
              onClose,
              setActiveScreen,
              undoCommit,
              messages: {
                successToast: (shortId) =>
                  t.modals.revert.successToast
                    .replace("{sha}", shortId)
                    .replace("{commit}", shortId),
                stagedToast: t.modals.revert.stagedToast,
                conflictToast: t.modals.revert.conflictToast,
                undoLabel: t.common.undo,
              },
            })(result, dialog.commit.short_id)
          }
        />
      )}
    </>
  );
}
