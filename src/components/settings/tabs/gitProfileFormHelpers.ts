import type { GitConfigDto } from "../../../ipc/client";
import { CONFIG_SCOPE, SETTINGS_SCOPE, type SettingsScope } from "../../../domain/enums";

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
    isOverride: localCfg.userNameSource === CONFIG_SCOPE.LOCAL,
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

export interface GitProfileSnapshot {
  isOverride: boolean;
  userName: string;
  userEmail: string;
  defaultBranch: string;
  gpgSign: boolean;
  gpgKey: string;
}

const REPO_SCOPE_KEYS: readonly (keyof GitProfileSnapshot)[] = [
  "isOverride",
  "userName",
  "userEmail",
  "gpgSign",
  "gpgKey",
];
const GLOBAL_SCOPE_KEYS: readonly (keyof GitProfileSnapshot)[] = [
  ...REPO_SCOPE_KEYS,
  "defaultBranch",
];

/** The values the form would show right after loading the given config; null before the load. */
export function deriveProfileBaseline(
  activeScope: SettingsScope,
  globalCfg: GitConfigDto | null,
  localCfg: GitConfigDto | null
): GitProfileSnapshot | null {
  if (!globalCfg) return null;
  if (activeScope === SETTINGS_SCOPE.REPO && localCfg) {
    return {
      ...deriveRepoScopeFields(localCfg, globalCfg),
      defaultBranch: globalCfg.defaultBranch || "main",
    };
  }
  return deriveGlobalScopeFields(globalCfg);
}

function normalize(value: string | boolean): string | boolean {
  return typeof value === "string" ? value.trim() : value;
}

/** True when the form differs from the loaded config (strings compared trimmed). */
export function isProfileDirty(
  current: GitProfileSnapshot,
  baseline: GitProfileSnapshot | null,
  activeScope: SettingsScope
): boolean {
  if (!baseline) return false;
  const keys = activeScope === SETTINGS_SCOPE.REPO ? REPO_SCOPE_KEYS : GLOBAL_SCOPE_KEYS;
  return keys.some((key) => normalize(current[key]) !== normalize(baseline[key]));
}
