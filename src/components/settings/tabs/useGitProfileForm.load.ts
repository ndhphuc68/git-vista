import { getGitConfig } from "../../../features/settings";
import type { GitConfigDto } from "../../../ipc/client";
import { deriveRepoScopeFields, deriveGlobalScopeFields } from "./gitProfileFormHelpers";
import { SETTINGS_SCOPE, type SettingsScope } from "../../../domain/enums";

export interface GitProfileLoadContext {
  currentRepoPath: string | null;
  activeScope: SettingsScope;
  isMounted: () => boolean;
  setGlobalConfig: (value: GitConfigDto) => void;
  setLocalConfig: (value: GitConfigDto) => void;
  setIsOverride: (value: boolean) => void;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setDefaultBranch: (value: string) => void;
  setGpgSign: (value: boolean) => void;
  setGpgKey: (value: string) => void;
  setLoading: (value: boolean) => void;
}

export interface GitProfileFieldSetters {
  setIsOverride: (value: boolean) => void;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setDefaultBranch: (value: string) => void;
  setGpgSign: (value: boolean) => void;
  setGpgKey: (value: string) => void;
}

/** Seeds the form fields from the loaded config, the same way for initial load and after save. */
export function applyProfileFields(
  setters: GitProfileFieldSetters,
  activeScope: SettingsScope,
  globalCfg: GitConfigDto,
  localCfg: GitConfigDto | null
): void {
  if (activeScope === SETTINGS_SCOPE.REPO && localCfg) {
    const fields = deriveRepoScopeFields(localCfg, globalCfg);
    setters.setIsOverride(fields.isOverride);
    setters.setUserName(fields.userName);
    setters.setUserEmail(fields.userEmail);
    setters.setGpgSign(fields.gpgSign);
    setters.setGpgKey(fields.gpgKey);
    return;
  }
  const fields = deriveGlobalScopeFields(globalCfg);
  setters.setIsOverride(fields.isOverride);
  setters.setUserName(fields.userName);
  setters.setUserEmail(fields.userEmail);
  setters.setDefaultBranch(fields.defaultBranch);
  setters.setGpgSign(fields.gpgSign);
  setters.setGpgKey(fields.gpgKey);
}

/** Loads the global (and, in repo scope, local) git config and seeds the form fields. */
export function createLoadConfigHandler(context: GitProfileLoadContext) {
  const { currentRepoPath, activeScope, isMounted, setGlobalConfig, setLocalConfig, setLoading } =
    context;

  return async () => {
    setLoading(true);
    try {
      const globalCfg = await getGitConfig(null);
      if (!isMounted()) return;
      setGlobalConfig(globalCfg);

      let localCfg: GitConfigDto | null = null;
      if (currentRepoPath) {
        localCfg = await getGitConfig(currentRepoPath);
        if (!isMounted()) return;
        setLocalConfig(localCfg);
      }

      applyProfileFields(context, activeScope, globalCfg, localCfg);
    } catch (err) {
      console.error("Failed to load git config:", err);
    } finally {
      if (isMounted()) setLoading(false);
    }
  };
}
