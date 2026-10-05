import { SCREEN_TYPE } from "../../../domain/enums";
import type { ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { useTranslation } from "../../../i18n";
import { useUndoGraphCommit } from "../api/useCommitGraph";
import type { GraphDialog } from "../model/graphDialog";
import { CommitGraphShellDialogs } from "./CommitGraphShellDialogs";
import { CommitGraphActionDialogs } from "./CommitGraphActionDialogs";

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
  CheckoutConflictModal: ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    repoPath: string;
    targetBranch: string;
    errorMessage: string;
    onNavigateToChanges: () => void;
  }>;
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
  CheckoutConflictModal,
}: CommitGraphDialogsProps) {
  const { currentRepo } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const undoCommit = useUndoGraphCommit(currentRepo?.path ?? "");
  if (!currentRepo) return null;

  return (
    <>
      <CommitGraphShellDialogs
        dialog={dialog}
        onClose={onClose}
        currentRepo={currentRepo}
        queryClient={queryClient}
        CreateTagModal={CreateTagModal}
        CreateBranchModal={CreateBranchModal}
        CheckoutConflictModal={CheckoutConflictModal}
        onNavigateToChanges={() => setActiveScreen(SCREEN_TYPE.CHANGES)}
      />
      <CommitGraphActionDialogs
        dialog={dialog}
        onClose={onClose}
        repoPath={currentRepo.path}
        currentBranch={currentRepo.head_branch ?? "main"}
        t={t}
        queryClient={queryClient}
        setActiveScreen={setActiveScreen}
        undoCommit={undoCommit}
      />
    </>
  );
}
