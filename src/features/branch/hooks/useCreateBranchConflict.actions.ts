import type { Translations } from "../../../i18n/vi";
import type { CreateBranchVars } from "../api";
import { useToastStore } from "../../../store/useToastStore";
import { describeCreateError } from "./useCreateBranchForm.actions";

export interface StashAndCreateBranchParams {
  name: string;
  targetCommit?: string;
  saveStash: (vars: { message: string; includeUntracked: boolean }) => Promise<unknown>;
  createBranch: (vars: CreateBranchVars) => Promise<unknown>;
  popStash: (vars: { index: number }) => Promise<unknown>;
  t: Translations;
  onSuccess?: () => void;
  onClose: () => void;
  setError: (err: string | null) => void;
}

/**
 * Puts the stash back after the create that followed it failed, and returns
 * the message telling the user where their changes are. A fresh stash is
 * always `stash@{0}`; the backend has already removed the half-made branch.
 */
async function restoreAfterFailedCreate(
  popStash: StashAndCreateBranchParams["popStash"],
  createError: string,
  stashMessage: string,
  t: Translations
): Promise<string> {
  const texts = t.modals.createBranch;
  try {
    await popStash({ index: 0 });
    return texts.createFailedRestored.replace("{msg}", createError);
  } catch {
    return texts.createFailedKeptInStash
      .replace("{msg}", createError)
      .replace("{stash}", stashMessage);
  }
}

/**
 * Stashes the working tree, creates and checks out the branch, then pops the
 * stash on it so the changes come along — like `git switch -c` would have.
 */
export async function stashAndCreateBranch({
  name,
  targetCommit,
  saveStash,
  createBranch,
  popStash,
  t,
  onSuccess,
  onClose,
  setError,
}: StashAndCreateBranchParams): Promise<void> {
  const texts = t.modals.createBranch;
  const stashMessage = texts.autoStashMessage.replace("{name}", name);
  setError(null);

  try {
    await saveStash({ message: stashMessage, includeUntracked: true });
  } catch (err: unknown) {
    setError(describeCreateError(err, t));
    return;
  }

  try {
    await createBranch({ name, targetCommit, checkout: true });
  } catch (err: unknown) {
    setError(
      await restoreAfterFailedCreate(popStash, describeCreateError(err, t), stashMessage, t)
    );
    return;
  }

  // The branch exists and HEAD is on it, so the modal closes either way; a
  // conflicting pop keeps the stash and only changes what the toast says.
  const toasts = useToastStore.getState();
  try {
    await popStash({ index: 0 });
    toasts.showSuccess(texts.carriedChangesSuccess.replace("{name}", name));
  } catch {
    toasts.showError(
      texts.changesKeptInStash.replace("{name}", name).replace("{stash}", stashMessage)
    );
  }
  onSuccess?.();
  onClose();
}
