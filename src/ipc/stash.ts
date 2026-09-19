/**
 * stash IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type StashItem } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

export const stashCommands = {
  getStashes: async (repoPath: string): Promise<StashItem[]> => {
    if (!isTauri()) {
      return [...mockState.stashes];
    }
    return unwrap(await commands.getStashes(repoPath));
  },

  saveStash: async (
    repoPath: string,
    message?: string | null,
    includeUntracked?: boolean
  ): Promise<string> => {
    if (!isTauri()) {
      const commitId = `mockstash${Date.now()}`;
      const newStash: StashItem = {
        index: 0,
        message: message || "WIP on current branch",
        commit_id: commitId,
        created_at: Math.floor(Date.now() / 1000),
      };
      mockState.stashes = [
        newStash,
        ...mockState.stashes.map((s, idx) => ({ ...s, index: idx + 1 })),
      ];
      return commitId;
    }
    return unwrap(await commands.saveStash(repoPath, message ?? null, includeUntracked ?? null));
  },

  applyStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.applyStash(repoPath, index);
  },

  popStash: async (repoPath: string, index: number): Promise<void> => {
    if (!isTauri()) {
      mockState.stashes = mockState.stashes
        .filter((s) => s.index !== index)
        .map((s, idx) => ({ ...s, index: idx }));
      return;
    }
    await commands.popStash(repoPath, index);
  },

  dropStash: async (repoPath: string, index: number): Promise<string> => {
    if (!isTauri()) {
      mockState.stashes = mockState.stashes
        .filter((s) => s.index !== index)
        .map((s, idx) => ({ ...s, index: idx }));
      return `refs/gitui-backup/stash-drop-undo-${Date.now()}`;
    }
    return unwrap(await commands.dropStash(repoPath, index));
  },
};
