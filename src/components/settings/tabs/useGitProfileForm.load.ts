import { getGitConfig } from "../../../features/settings";
import type { GitConfigDto } from "../../../ipc/client";
import { deriveRepoScopeFields, deriveGlobalScopeFields } from "./gitProfileFormHelpers";

export interface GitProfileLoadContext {
  currentRepoPath: string | null;
  activeScope: "global" | "repo";
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

/** Loads the global (and, in repo scope, local) git config and seeds the form fields. */
export function createLoadConfigHandler(context: GitProfileLoadContext) {
  const {
    currentRepoPath,
    activeScope,
    isMounted,
    setGlobalConfig,
    setLocalConfig,
    setIsOverride,
    setUserName,
    setUserEmail,
    setDefaultBranch,
    setGpgSign,
    setGpgKey,
    setLoading,
  } = context;

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

      if (activeScope === "repo" && localCfg) {
        const fields = deriveRepoScopeFields(localCfg, globalCfg);
        setIsOverride(fields.isOverride);
        setUserName(fields.userName);
        setUserEmail(fields.userEmail);
        setGpgSign(fields.gpgSign);
        setGpgKey(fields.gpgKey);
      } else {
        const fields = deriveGlobalScopeFields(globalCfg);
        setIsOverride(fields.isOverride);
        setUserName(fields.userName);
        setUserEmail(fields.userEmail);
        setDefaultBranch(fields.defaultBranch);
        setGpgSign(fields.gpgSign);
        setGpgKey(fields.gpgKey);
      }
    } catch (err) {
      console.error("Failed to load git config:", err);
    } finally {
      if (isMounted()) setLoading(false);
    }
  };
}
