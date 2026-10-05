import type { FormEvent } from "react";
import { getGitConfig, setGitConfig } from "../../../features/settings";
import type { GitConfigDto } from "../../../ipc/client";
import type { Translations } from "../../../i18n/vi";
import { applyProfileFields } from "./useGitProfileForm.load";
import { CONFIG_SCOPE, SETTINGS_SCOPE, type SettingsScope } from "../../../domain/enums";

export interface GitProfileActionsContext {
  activeScope: SettingsScope;
  currentRepoPath: string | null;
  isOverride: boolean;
  userName: string;
  userEmail: string;
  defaultBranch: string;
  gpgSign: boolean;
  gpgKey: string;
  globalConfig: GitConfigDto | null;
  t: Translations;
  setSaving: (value: boolean) => void;
  setGlobalConfig: (value: GitConfigDto) => void;
  setLocalConfig: (value: GitConfigDto) => void;
  setIsOverride: (value: boolean) => void;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setDefaultBranch: (value: string) => void;
  setGpgSign: (value: boolean) => void;
  setGpgKey: (value: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

/** Saves the profile form to global or repo-local git config, in the original key order. */
export function createSaveHandler(context: GitProfileActionsContext) {
  const {
    activeScope,
    currentRepoPath,
    isOverride,
    userName,
    userEmail,
    defaultBranch,
    gpgSign,
    gpgKey,
    t,
    setSaving,
    setGlobalConfig,
    setLocalConfig,
    showSuccess,
    showError,
  } = context;

  return async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeScope === SETTINGS_SCOPE.REPO && currentRepoPath) {
        if (isOverride) {
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.name", userName.trim());
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.email", userEmail.trim());
          await setGitConfig(
            currentRepoPath,
            CONFIG_SCOPE.LOCAL,
            "commit.gpgsign",
            String(gpgSign)
          );
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.signingkey", gpgKey.trim());
        } else {
          // Clear local override to inherit
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.name", "");
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.email", "");
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "commit.gpgsign", "");
          await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.signingkey", "");
        }
      } else {
        await setGitConfig(null, CONFIG_SCOPE.GLOBAL, "user.name", userName.trim());
        await setGitConfig(null, CONFIG_SCOPE.GLOBAL, "user.email", userEmail.trim());
        await setGitConfig(
          null,
          CONFIG_SCOPE.GLOBAL,
          "init.defaultBranch",
          defaultBranch.trim() || "main"
        );
        await setGitConfig(null, CONFIG_SCOPE.GLOBAL, "commit.gpgsign", String(gpgSign));
        await setGitConfig(null, CONFIG_SCOPE.GLOBAL, "user.signingkey", gpgKey.trim());
      }

      showSuccess(t.settings.profile.savedSuccess);

      // Reload config and re-seed the fields so the form matches what was stored
      const updatedGlobal = await getGitConfig(null);
      setGlobalConfig(updatedGlobal);
      let updatedLocal: GitConfigDto | null = null;
      if (currentRepoPath) {
        updatedLocal = await getGitConfig(currentRepoPath);
        setLocalConfig(updatedLocal);
      }
      applyProfileFields(context, activeScope, updatedGlobal, updatedLocal);
    } catch (err) {
      console.error("Failed to save git config:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };
}

/** Clears the repo-local override so the repo inherits the global identity again. */
export function createResetToGlobalHandler(context: GitProfileActionsContext) {
  const {
    currentRepoPath,
    globalConfig,
    t,
    setSaving,
    setLocalConfig,
    setIsOverride,
    setUserName,
    setUserEmail,
    setGpgSign,
    setGpgKey,
    showSuccess,
    showError,
  } = context;

  return async () => {
    if (!currentRepoPath) return;
    setSaving(true);
    try {
      await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.name", "");
      await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.email", "");
      await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "commit.gpgsign", "");
      await setGitConfig(currentRepoPath, CONFIG_SCOPE.LOCAL, "user.signingkey", "");

      const updatedLocal = await getGitConfig(currentRepoPath);
      setLocalConfig(updatedLocal);
      setIsOverride(false);
      if (globalConfig) {
        setUserName(globalConfig.userName || "");
        setUserEmail(globalConfig.userEmail || "");
        setGpgSign(Boolean(globalConfig.gpgSign));
        setGpgKey(globalConfig.gpgKey || "");
      }
      showSuccess(t.settings.profile.resetSuccess);
    } catch (err) {
      console.error("Failed to reset git config:", err);
      showError(String(err));
    } finally {
      setSaving(false);
    }
  };
}

export interface GitProfileSelectInheritContext {
  globalConfig: GitConfigDto | null;
  setIsOverride: (value: boolean) => void;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setGpgSign: (value: boolean) => void;
  setGpgKey: (value: string) => void;
}

/** Switches the repo scope back to inheriting the global identity (without saving yet). */
export function createSelectInheritHandler(context: GitProfileSelectInheritContext) {
  const { globalConfig, setIsOverride, setUserName, setUserEmail, setGpgSign, setGpgKey } = context;
  return () => {
    setIsOverride(false);
    if (globalConfig) {
      setUserName(globalConfig.userName || "");
      setUserEmail(globalConfig.userEmail || "");
      setGpgSign(Boolean(globalConfig.gpgSign));
      setGpgKey(globalConfig.gpgKey || "");
    }
  };
}
