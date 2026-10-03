import type { UseMutationResult } from "@tanstack/react-query";
import type { Translations } from "../../../i18n/vi";
import type { CreateBranchVars } from "../api";
import { mapGitError } from "../../../utils/errorMapping";

export function resolveInitialBaseRef(
  sourceBranch?: string,
  targetCommit?: string | null,
  remoteBranches?: { name: string }[]
): string {
  if (sourceBranch) {
    if (targetCommit?.startsWith("refs/")) return targetCommit;
    const isRemote = remoteBranches?.some((r) => r.name === sourceBranch);
    return isRemote ? `refs/remotes/${sourceBranch}` : `refs/heads/${sourceBranch}`;
  }
  return targetCommit ?? "";
}

/** The start point sent to the backend: the picked base ref, else the modal's target, else HEAD. */
export function resolveEffectiveTarget(
  selectedBaseRef: string,
  targetCommit?: string | null
): string | undefined {
  return selectedBaseRef || targetCommit || undefined;
}

/** One-line text for a failed create: the friendly message plus its hint. */
export function describeCreateError(err: unknown, t: Translations): string {
  const friendly = mapGitError(err, t);
  return [friendly.message, friendly.actionHint].filter(Boolean).join(" ") || t.common.error;
}

export interface SubmitCreateBranchParams {
  trimmed: string;
  selectedBaseRef: string;
  targetCommit?: string | null;
  checkout: boolean;
  createBranch: UseMutationResult<void, Error, CreateBranchVars, unknown>;
  t: Translations;
  onSuccess?: () => void;
  onClose: () => void;
  setError: (err: string | null) => void;
  /** Told whether the failure was a checkout conflict, so the modal can offer a way out. */
  setConflict: (conflict: boolean) => void;
}

export async function submitCreateBranch({
  trimmed,
  selectedBaseRef,
  targetCommit,
  checkout,
  createBranch,
  t,
  onSuccess,
  onClose,
  setError,
  setConflict,
}: SubmitCreateBranchParams): Promise<void> {
  setError(null);
  setConflict(false);

  try {
    await createBranch.mutateAsync({
      name: trimmed,
      targetCommit: resolveEffectiveTarget(selectedBaseRef, targetCommit),
      checkout,
    });
    if (onSuccess) onSuccess();
    onClose();
  } catch (err: unknown) {
    setConflict(checkout && mapGitError(err, t).kind === "checkoutConflict");
    setError(describeCreateError(err, t));
  }
}
