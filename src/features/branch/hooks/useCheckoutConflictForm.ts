import { useState, useEffect } from "react";
import { useSaveStash } from "../../stash";
import { useBranches, useCheckoutBranch } from "../api";
import { checkedOutBranchName } from "../model/checkoutTarget";
import { useRepoStore } from "../../../store/useRepoStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";

export interface CheckoutConflictFormOptions {
  isOpen: boolean;
  targetBranch: string;
  repoPath?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/** Stash-and-checkout retry state and handling for CheckoutConflictModal. */
export function useCheckoutConflictForm({
  isOpen,
  targetBranch,
  repoPath,
  onClose,
  onSuccess,
}: CheckoutConflictFormOptions) {
  const { t } = useTranslation();
  // repoPath is optional on this modal: the stash-and-checkout button only
  // renders when it is set, so an empty path never reaches the mutation.
  const checkoutBranch = useCheckoutBranch(repoPath ?? "");
  const saveStash = useSaveStash(repoPath ?? "");
  const { data: branchData } = useBranches(repoPath ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStashing, setIsStashing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsStashing(false);
      setActionError(null);
    }
  }, [isOpen]);

  const handleStashAndCheckout = async () => {
    if (!repoPath) return;
    setIsStashing(true);
    setActionError(null);
    try {
      await saveStash.mutateAsync({
        message: t.modals.checkoutConflict.autoStashMessage.replace("{target}", targetBranch),
        includeUntracked: true,
      });
      await checkoutBranch.mutateAsync({ name: targetBranch });
      // Same follow-up as a direct checkout: the selection and the toast name the
      // local branch HEAD landed on.
      const checkedOut = checkedOutBranchName(targetBranch, branchData);
      useRepoStore.getState().setSelectedBranch(checkedOut);
      useToastStore
        .getState()
        .showSuccess(t.sidebar.switchBranchSuccess.replace("{name}", checkedOut));
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(t.modals.checkoutConflict.stashError.replace("{msg}", msg));
    } finally {
      setIsStashing(false);
    }
  };

  return { t, actionError, isStashing, handleStashAndCheckout };
}
