/**
 * config IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type ConfigScope, type GitConfigDto } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

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

function setMockGlobalConfig(key: string, value: string) {
  const stringField = GLOBAL_STRING_KEYS[key];
  if (stringField) {
    mockState.globalConfig[stringField] = value;
    return;
  }
  const boolField = GLOBAL_BOOLEAN_KEYS[key];
  if (boolField) {
    mockState.globalConfig[boolField] = value === "true";
  }
}

function deleteMockLocalConfig(local: Partial<GitConfigDto>, key: string) {
  const stringField = LOCAL_STRING_KEYS[key];
  if (stringField) {
    delete local[stringField];
    return;
  }
  const boolField = LOCAL_BOOLEAN_KEYS[key];
  if (boolField) {
    delete local[boolField];
  }
}

function setMockLocalConfig(local: Partial<GitConfigDto>, key: string, value: string) {
  const stringField = LOCAL_STRING_KEYS[key];
  if (stringField) {
    local[stringField] = value;
    return;
  }
  const boolField = LOCAL_BOOLEAN_KEYS[key];
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
          userNameSource: local.userName ? "local" : "global",
          userEmail: local.userEmail ?? mockState.globalConfig.userEmail,
          userEmailSource: local.userEmail ? "local" : "global",
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
      if (scope === "global") {
        setMockGlobalConfig(key, value);
      } else if (scope === "local" && repoPath) {
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
    await commands.setGitConfig(repoPath ?? null, scope, key, value);
  },
};
