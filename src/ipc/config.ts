/**
 * config IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type ConfigScope, type GitConfigDto } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";
import { CONFIG_SCOPE } from "../domain/enums";

type StringConfigField = "userName" | "userEmail" | "defaultBranch" | "gpgKey";
type BooleanConfigField = "pullRebase" | "gpgSign" | "fetchPrune" | "rebaseAutostash";

// Global config accepts every mapped key, including the branch-only default.
const GLOBAL_STRING_KEYS: Record<string, StringConfigField> = {
  "user.name": "userName",
  "user.email": "userEmail",
  "init.defaultBranch": "defaultBranch",
  "user.signingkey": "gpgKey",
};
const GLOBAL_BOOLEAN_KEYS: Record<string, BooleanConfigField> = {
  "pull.rebase": "pullRebase",
  "commit.gpgsign": "gpgSign",
  "fetch.prune": "fetchPrune",
  "rebase.autoStash": "rebaseAutostash",
};

// Local (per-repo) config has no default-branch override, unlike global.
const LOCAL_STRING_KEYS: Record<string, StringConfigField> = {
  "user.name": "userName",
  "user.email": "userEmail",
  "user.signingkey": "gpgKey",
};
const LOCAL_BOOLEAN_KEYS: Record<string, BooleanConfigField> = GLOBAL_BOOLEAN_KEYS;

/**
 * Looks up `key` in `table`, but only among the table's own keys — a plain
 * `table[key]` lookup would also resolve inherited `Object.prototype`
 * members (e.g. `"toString"`), silently treating an unknown config key as a
 * mapped one. `Object.hasOwn` keeps an unknown key falling through exactly
 * like any other unmapped key.
 */
function getMappedField<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

// Exported for unit testing only; not part of this module's public API surface.
export function setMockGlobalConfig(key: string, value: string) {
  const stringField = getMappedField(GLOBAL_STRING_KEYS, key);
  if (stringField) {
    mockState.globalConfig[stringField] = value;
    return;
  }
  const boolField = getMappedField(GLOBAL_BOOLEAN_KEYS, key);
  if (boolField) {
    mockState.globalConfig[boolField] = value === "true";
  }
}

// Exported for unit testing only; not part of this module's public API surface.
export function deleteMockLocalConfig(local: Partial<GitConfigDto>, key: string) {
  const stringField = getMappedField(LOCAL_STRING_KEYS, key);
  if (stringField) {
    delete local[stringField];
    return;
  }
  const boolField = getMappedField(LOCAL_BOOLEAN_KEYS, key);
  if (boolField) {
    delete local[boolField];
  }
}

// Exported for unit testing only; not part of this module's public API surface.
export function setMockLocalConfig(local: Partial<GitConfigDto>, key: string, value: string) {
  const stringField = getMappedField(LOCAL_STRING_KEYS, key);
  if (stringField) {
    local[stringField] = value;
    return;
  }
  const boolField = getMappedField(LOCAL_BOOLEAN_KEYS, key);
  if (boolField) {
    local[boolField] = value === "true";
  }
}

export const configCommands = {
  getGitConfig: async (repoPath?: string | null): Promise<GitConfigDto> => {
    if (!isTauri()) {
      if (repoPath && mockState.localConfigs[repoPath]) {
        const local = mockState.localConfigs[repoPath];
        return {
          userName: local.userName ?? mockState.globalConfig.userName,
          userNameSource: local.userName ? CONFIG_SCOPE.LOCAL : CONFIG_SCOPE.GLOBAL,
          userEmail: local.userEmail ?? mockState.globalConfig.userEmail,
          userEmailSource: local.userEmail ? CONFIG_SCOPE.LOCAL : CONFIG_SCOPE.GLOBAL,
          defaultBranch: local.defaultBranch ?? mockState.globalConfig.defaultBranch,
          pullRebase: local.pullRebase ?? mockState.globalConfig.pullRebase,
          gpgSign: local.gpgSign ?? mockState.globalConfig.gpgSign,
          gpgKey: local.gpgKey ?? mockState.globalConfig.gpgKey,
          fetchPrune: local.fetchPrune ?? mockState.globalConfig.fetchPrune,
          rebaseAutostash: local.rebaseAutostash ?? mockState.globalConfig.rebaseAutostash,
        };
      }
      return { ...mockState.globalConfig };
    }
    return unwrap(await commands.getGitConfig(repoPath ?? null));
  },

  setGitConfig: async (
    repoPath: string | null | undefined,
    scope: ConfigScope,
    key: string,
    value: string
  ): Promise<void> => {
    if (!isTauri()) {
      if (scope === CONFIG_SCOPE.GLOBAL) {
        setMockGlobalConfig(key, value);
      } else if (scope === CONFIG_SCOPE.LOCAL && repoPath) {
        if (!mockState.localConfigs[repoPath]) mockState.localConfigs[repoPath] = {};
        const local = mockState.localConfigs[repoPath];
        if (value.trim() === "") {
          deleteMockLocalConfig(local, key);
        } else {
          setMockLocalConfig(local, key, value);
        }
      }
      return;
    }
    unwrap(await commands.setGitConfig(repoPath ?? null, scope, key, value));
  },
};
