import { useState, useEffect } from "react";
import { usePopStash, useSaveStash } from "../../stash";
import { useBranches, useCheckoutBranch } from "../api";
import { checkedOutBranchName } from "../model/checkoutTarget";
import { useRepoStore } from "../../../store/useRepoStore";
import { useToastStore } from "../../../store/useToastStore";
import { useTranslation } from "../../../i18n";
import { toErrorMessage } from "../../../shared/utils/toError";

export interface CheckoutConflictFormOptions {
  isOpen: boolean;
  targetBranch: string;
  repoPath?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Translation = ReturnType<typeof useTranslation>["t"];

/**
 * Puts the auto-stash back after the checkout that followed it failed, and
 * returns the message telling the user where their changes are. A fresh stash
 * is always `stash@{0}`.
 */
async function restoreAutoStash(
  popStash: (vars: { index: number }) => Promise<unknown>,
  checkoutError: string,
  stashMessage: string,
  t: Translation
): Promise<string> {
  const texts = t.modals.checkoutConflict;
  try {
    await popStash({ index: 0 });
    return texts.checkoutFailedRestored.replace("{msg}", checkoutError);
  } catch {
    return texts.checkoutFailedKeptInStash
      .replace("{msg}", checkoutError)
      .replace("{stash}", stashMessage);
  }
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
  const popStash = usePopStash(repoPath ?? "");
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
    const stashMessage = t.modals.checkoutConflict.autoStashMessage.replace(
      "{target}",
      targetBranch
    );
    let stashed = false;
    try {
      await saveStash.mutateAsync({ message: stashMessage, includeUntracked: true });
      stashed = true;
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
      const msg = toErrorMessage(err);
      // Leaving the changes stashed after a failed checkout would make them
      // look lost, so they go back unless the pop itself fails.
      setActionError(
        stashed
          ? await restoreAutoStash(popStash.mutateAsync, msg, stashMessage, t)
          : t.modals.checkoutConflict.stashError.replace("{msg}", msg)
      );
    } finally {
      setIsStashing(false);
    }
  };

  return { t, actionError, isStashing, handleStashAndCheckout };
}
