/**
 * remote IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type PruneResult, type RemoteItem } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

export const remoteCommands = {
  getRemotes: async (repoPath: string): Promise<RemoteItem[]> => {
    if (!isTauri()) {
      return [...mockState.remotes];
    }
    return unwrap(await commands.getRemotes(repoPath));
  },

  addRemote: async (repoPath: string, name: string, url: string): Promise<RemoteItem> => {
    if (!isTauri()) {
      const newRemote: RemoteItem = {
        name,
        fetch_url: url,
        push_url: url,
        branch_count: 0,
        is_default: mockState.remotes.length === 0,
      };
      mockState.remotes.push(newRemote);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return newRemote;
    }
    return unwrap(await commands.addRemote(repoPath, name, url));
  },

  renameRemote: async (repoPath: string, oldName: string, newName: string): Promise<void> => {
    if (!isTauri()) {
      const r = mockState.remotes.find((x) => x.name === oldName);
      if (r) r.name = newName;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.renameRemote(repoPath, oldName, newName);
  },

  removeRemote: async (repoPath: string, name: string): Promise<void> => {
    if (!isTauri()) {
      mockState.remotes = mockState.remotes.filter((x) => x.name !== name);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.removeRemote(repoPath, name);
  },

  setRemoteUrl: async (
    repoPath: string,
    name: string,
    fetchUrl: string,
    pushUrl?: string | null
  ): Promise<void> => {
    if (!isTauri()) {
      const r = mockState.remotes.find((x) => x.name === name);
      if (r) {
        r.fetch_url = fetchUrl;
        r.push_url = pushUrl !== undefined && pushUrl !== null ? pushUrl : fetchUrl;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "remotes",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.setRemoteUrl(repoPath, name, fetchUrl, pushUrl ?? null);
  },

  pruneRemote: async (repoPath: string, remote: string, taskId?: string): Promise<PruneResult> => {
    if (!isTauri()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: "prune",
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return {
        remote,
        pruned_branches: [`${remote}/stale-mock-branch`],
        message: "Đã dọn dẹp 1 nhánh remote.",
      };
    }
    return unwrap(await commands.pruneRemote(repoPath, remote, taskId ?? null));
  },

  fetchRepo: async (
    repoPath: string,
    remote?: string,
    prune?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Fetch hoàn tất";
    }
    return unwrap(
      await commands.fetchRepo(repoPath, remote ?? null, prune ?? null, taskId ?? null)
    );
  },

  pullRepo: async (
    repoPath: string,
    remote?: string,
    branch?: string,
    rebase?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Pull hoàn tất";
    }
    return unwrap(
      await commands.pullRepo(
        repoPath,
        remote ?? null,
        branch ?? null,
        rebase ?? null,
        taskId ?? null
      )
    );
  },

  pushRepo: async (
    repoPath: string,
    remote?: string,
    branch?: string,
    setUpstream?: boolean,
    force?: boolean,
    taskId?: string
  ): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Push hoàn tất";
    }
    return unwrap(
      await commands.pushRepo(
        repoPath,
        remote ?? null,
        branch ?? null,
        setUpstream ?? null,
        force ?? null,
        taskId ?? null
      )
    );
  },

  cloneRepo: async (url: string, targetDir: string, taskId?: string): Promise<string> => {
    if (!isTauri()) {
      return "[Browser mock] Clone hoàn tất";
    }
    return unwrap(await commands.cloneRepo(url, targetDir, taskId ?? null));
  },

  cancelRemoteTask: async (taskId: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.cancelRemoteTask(taskId);
  },

  setRepoPullRebase: async (repoPath: string, rebase: boolean): Promise<void> => {
    if (!isTauri()) {
      if (!mockState.localConfigs[repoPath]) mockState.localConfigs[repoPath] = {};
      mockState.localConfigs[repoPath].pullRebase = rebase;
      return;
    }
    await commands.setRepoPullRebase(repoPath, rebase);
  },
};
