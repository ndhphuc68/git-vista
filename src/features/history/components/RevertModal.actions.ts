import type React from "react";
import type { CommitActionResult } from "../../../ipc/bindings.generated";
import type { Translations } from "../../../i18n/vi";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { toErrorMessage } from "../../../shared/utils/toError";
import { revertCommit } from "../api/commitActionsApi";
import { OPERATION_STATUS } from "../../../domain/enums";

interface RevertSubmitHandlerContext {
  repoPath: string;
  commitId: string;
  autoCommit: boolean;
  t: Translations;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onClose: () => void;
  onSuccess?: (result: CommitActionResult) => void;
}

/** Builds the revert form's submit handler: runs the revert and reports the outcome. */
export function createRevertSubmitHandler(ctx: RevertSubmitHandlerContext) {
  const { repoPath, commitId, autoCommit, t, setLoading, setError, onClose, onSuccess } = ctx;

  return async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await revertCommit(repoPath, commitId, autoCommit);

      if (res.success || res.status === OPERATION_STATUS.CONFLICT) {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        const errorMsg = res.output || t.modals.revert.genericError.replace("{msg}", res.status);
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      setError(msg || t.common.error);
      useToastStore.getState().showError(mapGitError(err));
    } finally {
      setLoading(false);
    }
  };
}
