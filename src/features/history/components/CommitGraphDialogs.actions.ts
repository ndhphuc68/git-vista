import type { QueryClient } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { useToastStore } from "../../../store/useToastStore";
import type { CommitActionResult } from "../../../ipc/bindings.generated";

interface CommitActionMessages {
  /** Success toast text, given the target commit's short SHA. */
  successToast: (shortId: string) => string;
  stagedToast: string;
  conflictToast: string;
  undoLabel: string;
}

interface CommitActionSuccessHandlerContext {
  queryClient: QueryClient;
  repoPath: string;
  onClose: () => void;
  setActiveScreen: (screen: "changes") => void;
  undoCommit: (undoToken: string) => Promise<void>;
  messages: CommitActionMessages;
}

/**
 * Shared cherry-pick/revert onSuccess handling: same invalidated keys, same
 * toast-vs-navigate branching per result status, only the messages differ.
 */
export function createCommitActionSuccessHandler(ctx: CommitActionSuccessHandlerContext) {
  const { queryClient, repoPath, onClose, setActiveScreen, undoCommit, messages } = ctx;

  return (result: CommitActionResult, commitShortId: string) => {
    onClose();
    if (result.status === "Committed") {
      queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.repo.head(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      const undoToken = result.undo_token;
      useToastStore.getState().showSuccess(
        messages.successToast(commitShortId),
        undoToken
          ? async () => {
              await undoCommit(undoToken);
            }
          : undefined,
        messages.undoLabel
      );
    } else if (result.status === "Staged") {
      queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
      useToastStore.getState().showToast({ message: messages.stagedToast, type: "info" });
      setActiveScreen("changes");
    } else if (result.status === "Conflict") {
      queryClient.invalidateQueries({ queryKey: qk.repo.status(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.repo.state(repoPath) });
      useToastStore.getState().showToast({ message: messages.conflictToast, type: "error" });
      setActiveScreen("changes");
    }
  };
}
