/**
 * app IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type RepoHeadInfo, type SystemInfo } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const appCommands = {
  ping: async (msg: string): Promise<string> => {
    if (!isTauri()) {
      return `[Browser mock] Pong: ${msg} (at ${new Date().toLocaleTimeString()})`;
    }
    // `ping` is the only command that does not return a Result, so it has no
    // status envelope to unwrap.
    return await commands.ping(msg);
  },

  getSystemInfo: async (): Promise<SystemInfo> => {
    if (!isTauri()) {
      return {
        os: "browser-dev",
        arch: "x86_64",
        git_version: "git version mock-2.50",
        app_version: "0.1.0",
      };
    }
    return unwrap(await commands.getSystemInfo());
  },

  getRepoHeadInfo: async (repoPath: string): Promise<RepoHeadInfo> => {
    if (!isTauri()) {
      return {
        branch_name: "main",
        head_commit_id: "abc1234567890",
        is_detached: false,
        ahead: 0,
        behind: 0,
        upstream: "origin/main",
      };
    }
    return unwrap(await commands.getRepoHeadInfo(repoPath));
  },

  simulateRepoChange: async (repoPath: string): Promise<void> => {
    if (!isTauri()) {
      window.dispatchEvent(
        new CustomEvent("mock-repo-changed", {
          detail: {
            repo_path: repoPath,
            reason: "Simulated trigger in browser",
            timestamp_ms: Date.now(),
          },
        })
      );
      return;
    }
    unwrap(await commands.simulateRepoChange(repoPath));
  },
};
