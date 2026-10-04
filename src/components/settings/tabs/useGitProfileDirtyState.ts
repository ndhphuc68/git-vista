import type { UseGitProfileFormFieldsResult } from "./useGitProfileFormFields";
import type { UseGitProfileFormStatusResult } from "./useGitProfileFormStatus";
import { deriveProfileBaseline, isProfileDirty } from "./gitProfileFormHelpers";

export interface UseGitProfileDirtyStateResult {
  isDirty: boolean;
  handleDiscard: () => void;
}

/** Compares the form with the loaded config and restores it on discard. */
export function useGitProfileDirtyState(
  fields: UseGitProfileFormFieldsResult,
  status: UseGitProfileFormStatusResult,
  activeScope: "global" | "repo"
): UseGitProfileDirtyStateResult {
  const baseline = deriveProfileBaseline(activeScope, status.globalConfig, status.localConfig);
  const current = {
    isOverride: status.isOverride,
    userName: fields.userName,
    userEmail: fields.userEmail,
    defaultBranch: fields.defaultBranch,
    gpgSign: fields.gpgSign,
    gpgKey: fields.gpgKey,
  };

  const handleDiscard = () => {
    if (!baseline) return;
    status.setIsOverride(baseline.isOverride);
    fields.setUserName(baseline.userName);
    fields.setUserEmail(baseline.userEmail);
    fields.setGpgSign(baseline.gpgSign);
    fields.setGpgKey(baseline.gpgKey);
    if (activeScope === "global") fields.setDefaultBranch(baseline.defaultBranch);
  };

  return { isDirty: isProfileDirty(current, baseline, activeScope), handleDiscard };
}
