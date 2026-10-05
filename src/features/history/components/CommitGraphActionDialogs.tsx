import type { QueryClient } from "@tanstack/react-query";
import type { SCREEN_TYPE } from "../../../domain/enums";
import type { useTranslation } from "../../../i18n";
import { InteractiveRebaseModal } from "../../../components/rebase";
import { CompareModal } from "../../../components/compare";
import type { GraphDialog } from "../model/graphDialog";
import { qk } from "../../../domain/queryKeys";
import { CommitGraphUndoableDialogs } from "./CommitGraphUndoableDialogs";

interface CommitGraphActionDialogsProps {
  dialog: GraphDialog;
  onClose: () => void;
  repoPath: string;
  currentBranch: string;
  t: ReturnType<typeof useTranslation>["t"];
  queryClient: QueryClient;
  setActiveScreen: (screen: typeof SCREEN_TYPE.CHANGES) => void;
  undoCommit: (undoToken: string) => Promise<void>;
}

/** Cherry-pick / revert / interactive rebase / compare dialogs, owned by this feature. */
export function CommitGraphActionDialogs({
  dialog,
  onClose,
  repoPath,
  currentBranch,
  t,
  queryClient,
  setActiveScreen,
  undoCommit,
}: CommitGraphActionDialogsProps) {
  return (
    <>
      <CommitGraphUndoableDialogs
        dialog={dialog}
        onClose={onClose}
        repoPath={repoPath}
        currentBranch={currentBranch}
        t={t}
        queryClient={queryClient}
        setActiveScreen={setActiveScreen}
        undoCommit={undoCommit}
      />

      {dialog.type === "interactiveRebase" && (
        <InteractiveRebaseModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={repoPath}
          baseCommitId={dialog.commit.id}
          baseCommitSummary={dialog.commit.summary}
          onRebaseSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
            queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
            queryClient.invalidateQueries({ queryKey: qk.repo.head(repoPath) });
            queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
          }}
        />
      )}

      {dialog.type === "compare" && (
        <CompareModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={repoPath}
          initialBaseRev={dialog.baseRev}
          initialTargetRev={dialog.targetRev}
        />
      )}
    </>
  );
}
