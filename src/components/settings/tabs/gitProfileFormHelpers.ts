import type { GitConfigDto } from "../../../ipc/client";

export interface GitProfileRepoFields {
  isOverride: boolean;
  userName: string;
  userEmail: string;
  gpgSign: boolean;
  gpgKey: string;
}

export interface GitProfileGlobalFields {
  isOverride: false;
  userName: string;
  userEmail: string;
  defaultBranch: string;
  gpgSign: boolean;
  gpgKey: string;
}

/** Seeds the form from repo-local config, falling back to the inherited global values. */
export function deriveRepoScopeFields(
  localCfg: GitConfigDto,
  globalCfg: GitConfigDto
): GitProfileRepoFields {
  return {
    isOverride: localCfg.userNameSource === "local",
    userName: localCfg.userName || globalCfg.userName || "",
    userEmail: localCfg.userEmail || globalCfg.userEmail || "",
    gpgSign: localCfg.gpgSign ?? globalCfg.gpgSign ?? false,
    gpgKey: localCfg.gpgKey ?? globalCfg.gpgKey ?? "",
  };
}

/** Seeds the form from global config alone (global scope, or repo scope with no local config yet). */
export function deriveGlobalScopeFields(globalCfg: GitConfigDto): GitProfileGlobalFields {
  return {
    isOverride: false,
    userName: globalCfg.userName || "",
    userEmail: globalCfg.userEmail || "",
    defaultBranch: globalCfg.defaultBranch || "main",
    gpgSign: Boolean(globalCfg.gpgSign),
    gpgKey: globalCfg.gpgKey || "",
  };
}
