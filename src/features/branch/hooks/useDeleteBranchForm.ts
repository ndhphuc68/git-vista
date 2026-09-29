import { useState, useEffect } from "react";
import { undoDeleteBranch } from "../../undo";
import { useDeleteBranch } from "../api";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { useTranslation } from "../../../i18n";

export interface DeleteBranchFormOptions {
  isOpen: boolean;
  repoPath: string;
  branchName: string;
  onClose: () => void;
  onSuccess?: (backupRef: string) => void;
}

/** Delete state, the unmerged-branch retry path and the undo toast for DeleteBranchModal. */
export function useDeleteBranchForm({
  isOpen,
  repoPath,
  branchName,
  onClose,
  onSuccess,
}: DeleteBranchFormOptions) {
  const { t } = useTranslation();
  const deleteBranch = useDeleteBranch(repoPath);
  const [error, setError] = useState<string | null>(null);
  const [isUnmerged, setIsUnmerged] = useState(false);
  const loading = deleteBranch.isPending;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsUnmerged(false);
    }
  }, [isOpen, branchName]);

  const handleDelete = async (force: boolean) => {
    setError(null);

    try {
      const backupRef = await deleteBranch.mutateAsync({ name: branchName, force });
      useToastStore.getState().showToast({
        message: t.modals.deleteBranch.successToast.replace("{name}", branchName),
        type: "success",
        durationMs: 10000,
        undoAction: async () => {
          await undoDeleteBranch(repoPath, branchName, backupRef);
        },
      });
      if (onSuccess) onSuccess(backupRef);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
