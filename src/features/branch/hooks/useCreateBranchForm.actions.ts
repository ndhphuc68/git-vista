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
}: SubmitCreateBranchParams): Promise<void> {
  setError(null);
  const effectiveTarget = selectedBaseRef || targetCommit || undefined;

  try {
    await createBranch.mutateAsync({
      name: trimmed,
      targetCommit: effectiveTarget,
      checkout,
    });
    if (onSuccess) onSuccess();
    onClose();
  } catch (err: unknown) {
    const friendly = mapGitError(err, t);
    setError([friendly.message, friendly.actionHint].filter(Boolean).join(" ") || t.common.error);
  }
}
