import type { Translations } from "../../i18n/vi";
import type { RebasePlanStep, InteractiveRebaseResult } from "../../ipc/bindings.generated";
import type { ActiveScreen } from "../../store/useViewStore";
import { useToastStore } from "../../store/useToastStore";
import { messageOf } from "../../shared/utils/toError";
import { executeInteractiveRebase } from "../../features/merge";
import { undoCommit } from "../../features/undo";

export interface SubmitHandlerContext {
  t: Translations;
  repoPath: string;
  baseCommitId: string;
  steps: RebasePlanStep[];
  autoStash: boolean;
  canSubmit: boolean;
  setError: (message: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  onClose: () => void;
  onRebaseSuccess?: (result: InteractiveRebaseResult) => void;
}

function showRebaseSuccessToast(
  context: Pick<SubmitHandlerContext, "t" | "repoPath">,
  result: InteractiveRebaseResult
) {
  const { t, repoPath } = context;
  if (result.undo_token) {
    const undoToken = result.undo_token;
    useToastStore.getState().showSuccess(
      t.modals.interactiveRebase.successToast,
      async () => {
        try {
          await undoCommit(repoPath, undoToken);
          useToastStore.getState().showSuccess(t.modals.interactiveRebase.undoSuccessToast);
        } catch (err: unknown) {
          useToastStore.getState().showError(messageOf(err) || "Failed to undo rebase");
        }
      },
      t.toast.undo
    );
  } else {
    useToastStore.getState().showSuccess(t.modals.interactiveRebase.successToast);
  }
}

/**
 * Factory for InteractiveRebaseModal's submit handler: validates step messages,
 * calls the rebase IPC, and routes the result to a success toast (with undo),
 * a conflict redirect, or an inline error. Verbatim move out of the component
 * so its JSX body stays under the line-per-function limit.
 */
export function createSubmitHandler(context: SubmitHandlerContext) {
  return async () => {
    const {
      t,
      repoPath,
      baseCommitId,
      steps,
      autoStash,
      canSubmit,
      setError,
      setSubmitting,
      setActiveScreen,
      onClose,
      onRebaseSuccess,
    } = context;

    if (!canSubmit) return;
    setError(null);

    // Validate messages
    for (const s of steps) {
      if (
        (s.action === "Reword" || s.action === "Squash") &&
        (!s.new_message || s.new_message.trim() === "")
      ) {
        setError(t.modals.interactiveRebase.validation.emptyMessage);
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await executeInteractiveRebase(repoPath, baseCommitId, steps, autoStash);

      if (result.success) {
        showRebaseSuccessToast({ t, repoPath }, result);
        onRebaseSuccess?.(result);
        onClose();
      } else if (result.status === "Conflict") {
        useToastStore
          .getState()
          .showToast({ type: "error", message: t.modals.interactiveRebase.conflictToast });
        setActiveScreen("changes");
        onClose();
      } else {
        setError(
          result.output || t.modals.interactiveRebase.errorToast.replace("{msg}", result.status)
        );
      }
    } catch (err: unknown) {
      setError(
        messageOf(err) || t.modals.interactiveRebase.errorToast.replace("{msg}", String(err))
      );
    } finally {
      setSubmitting(false);
    }
  };
}
