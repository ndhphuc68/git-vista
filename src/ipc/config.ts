/**
 * config IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type ConfigScope, type GitConfigDto } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

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
        if (key === "user.name") mockState.globalConfig.userName = value;
        if (key === "user.email") mockState.globalConfig.userEmail = value;
        if (key === "init.defaultBranch") mockState.globalConfig.defaultBranch = value;
        if (key === "pull.rebase") mockState.globalConfig.pullRebase = value === "true";
        if (key === "commit.gpgsign") mockState.globalConfig.gpgSign = value === "true";
        if (key === "user.signingkey") mockState.globalConfig.gpgKey = value;
        if (key === "fetch.prune") mockState.globalConfig.fetchPrune = value === "true";
        if (key === "rebase.autoStash") mockState.globalConfig.rebaseAutostash = value === "true";
      } else if (scope === "local" && repoPath) {
        if (!mockState.localConfigs[repoPath]) mockState.localConfigs[repoPath] = {};
        if (value.trim() === "") {
          if (key === "user.name") delete mockState.localConfigs[repoPath].userName;
          if (key === "user.email") delete mockState.localConfigs[repoPath].userEmail;
          if (key === "pull.rebase") delete mockState.localConfigs[repoPath].pullRebase;
          if (key === "commit.gpgsign") delete mockState.localConfigs[repoPath].gpgSign;
          if (key === "user.signingkey") delete mockState.localConfigs[repoPath].gpgKey;
          if (key === "fetch.prune") delete mockState.localConfigs[repoPath].fetchPrune;
          if (key === "rebase.autoStash") delete mockState.localConfigs[repoPath].rebaseAutostash;
        } else {
          if (key === "user.name") mockState.localConfigs[repoPath].userName = value;
          if (key === "user.email") mockState.localConfigs[repoPath].userEmail = value;
          if (key === "pull.rebase") mockState.localConfigs[repoPath].pullRebase = value === "true";
          if (key === "commit.gpgsign") mockState.localConfigs[repoPath].gpgSign = value === "true";
          if (key === "user.signingkey") mockState.localConfigs[repoPath].gpgKey = value;
          if (key === "fetch.prune") mockState.localConfigs[repoPath].fetchPrune = value === "true";
          if (key === "rebase.autoStash")
            mockState.localConfigs[repoPath].rebaseAutostash = value === "true";
        }
      }
      return;
    }
    await commands.setGitConfig(repoPath ?? null, scope, key, value);
  },
};
