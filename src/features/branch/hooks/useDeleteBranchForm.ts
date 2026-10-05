import { useState, useEffect } from "react";
import { useDeleteBranch } from "../api";
import { showDeleteBranchUndoToast } from "./deleteBranchToast";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { useTranslation } from "../../../i18n";
import { toErrorMessage } from "../../../shared/utils/toError";

export interface DeleteBranchFormOptions {
  isOpen: boolean;
  repoPath: string;
  branchName: string;
  onClose: () => void;
  onSuccess?: (backupRef: string) => void;
  initialUnmerged?: boolean;
}

/** Delete state, the unmerged-branch retry path and the undo toast for DeleteBranchModal. */
export function useDeleteBranchForm({
  isOpen,
  repoPath,
  branchName,
  onClose,
  onSuccess,
  initialUnmerged,
}: DeleteBranchFormOptions) {
  const { t } = useTranslation();
  const deleteBranch = useDeleteBranch(repoPath);
  const [error, setError] = useState<string | null>(null);
  const [isUnmerged, setIsUnmerged] = useState(false);
  const loading = deleteBranch.isPending;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsUnmerged(Boolean(initialUnmerged));
    }
  }, [isOpen, branchName, initialUnmerged]);

  const handleDelete = async (force: boolean) => {
    setError(null);

    try {
      const backupRef = await deleteBranch.mutateAsync({ name: branchName, force });
      showDeleteBranchUndoToast(repoPath, branchName, backupRef, t);
      if (onSuccess) onSuccess(backupRef);
      onClose();
    } catch (err: unknown) {
      const msg = toErrorMessage(err);
      if (msg.includes("UNMERGED_BRANCH")) {
        setIsUnmerged(true);
      } else {
        setError(msg || t.modals.deleteBranch.errorGeneric);
        useToastStore.getState().showError(mapGitError(err));
      }
    }
  };

  return { t, error, isUnmerged, loading, handleDelete };
}
