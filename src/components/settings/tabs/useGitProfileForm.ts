import type { FormEvent } from "react";
import { useTranslation } from "../../../i18n";
import type { GitConfigDto } from "../../../ipc/client";
import { useToastStore } from "../../../store/useToastStore";
import { useGitProfileFormFields } from "./useGitProfileFormFields";
import { useGitProfileFormStatus } from "./useGitProfileFormStatus";
import { useGitProfileDirtyState } from "./useGitProfileDirtyState";
import { useGitProfileFormLoadEffect } from "./useGitProfileFormLoadEffect";
import {
  createSaveHandler,
  createResetToGlobalHandler,
  createSelectInheritHandler,
} from "./useGitProfileForm.actions";
import { CONFIG_SCOPE, SETTINGS_SCOPE, type SettingsScope } from "../../../domain/enums";

export interface UseGitProfileFormOptions {
  currentRepoPath: string | null;
  activeScope: SettingsScope;
}

export interface UseGitProfileFormResult {
  userName: string;
  setUserName: (value: string) => void;
  userEmail: string;
  setUserEmail: (value: string) => void;
  defaultBranch: string;
  setDefaultBranch: (value: string) => void;
  gpgSign: boolean;
  setGpgSign: (value: boolean) => void;
  gpgKey: string;
  setGpgKey: (value: string) => void;
  globalConfig: GitConfigDto | null;
  localConfig: GitConfigDto | null;
  isOverride: boolean;
  setIsOverride: (value: boolean) => void;
  loading: boolean;
  saving: boolean;
  hasLocalOverride: boolean;
  isDirty: boolean;
  handleDiscard: () => void;
  handleSave: (e: FormEvent) => Promise<void>;
  handleResetToGlobal: () => Promise<void>;
  handleSelectInherit: () => void;
  handleSelectOverride: () => void;
}

/** Loads, edits, and saves the git profile (identity, GPG signing) form state. */
export function useGitProfileForm({
  currentRepoPath,
  activeScope,
}: UseGitProfileFormOptions): UseGitProfileFormResult {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToastStore();
  const fields = useGitProfileFormFields();
  const status = useGitProfileFormStatus();
  const dirty = useGitProfileDirtyState(fields, status, activeScope);

  useGitProfileFormLoadEffect({
    currentRepoPath,
    activeScope,
    setGlobalConfig: status.setGlobalConfig,
    setLocalConfig: status.setLocalConfig,
    setIsOverride: status.setIsOverride,
    setUserName: fields.setUserName,
    setUserEmail: fields.setUserEmail,
    setDefaultBranch: fields.setDefaultBranch,
    setGpgSign: fields.setGpgSign,
    setGpgKey: fields.setGpgKey,
    setLoading: status.setLoading,
  });

  const actionsContext = {
    activeScope,
    currentRepoPath,
    isOverride: status.isOverride,
    userName: fields.userName,
    userEmail: fields.userEmail,
    defaultBranch: fields.defaultBranch,
    gpgSign: fields.gpgSign,
    gpgKey: fields.gpgKey,
    globalConfig: status.globalConfig,
    t,
    setSaving: status.setSaving,
    setGlobalConfig: status.setGlobalConfig,
    setLocalConfig: status.setLocalConfig,
    setIsOverride: status.setIsOverride,
    setUserName: fields.setUserName,
    setUserEmail: fields.setUserEmail,
    setDefaultBranch: fields.setDefaultBranch,
    setGpgSign: fields.setGpgSign,
    setGpgKey: fields.setGpgKey,
    showSuccess,
    showError,
  };

  const hasLocalOverride =
    activeScope === SETTINGS_SCOPE.REPO &&
    Boolean(
      status.localConfig?.userNameSource === CONFIG_SCOPE.LOCAL && status.localConfig?.userName
    );

  return {
    ...fields,
    ...status,
    hasLocalOverride,
    ...dirty,
    handleSave: createSaveHandler(actionsContext),
    handleResetToGlobal: createResetToGlobalHandler(actionsContext),
    handleSelectInherit: createSelectInheritHandler(actionsContext),
    handleSelectOverride: () => status.setIsOverride(true),
  };
}
