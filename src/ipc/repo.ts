/**
 * repo IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type RecentRepoEntry, type RepoSummary } from "./bindings.generated";
import { isTauri, unwrap } from "./core";

export const repoCommands = {
  openRepository: async (path: string): Promise<RepoSummary> => {
    if (!isTauri()) {
      return {
        path,
        name: path.split("/").pop() || "mock-repo",
        is_bare: false,
        head_branch: "main",
        head_commit_id: "a1b2c3d",
      };
    }
    return unwrap(await commands.openRepository(path));
  },

  closeRepository: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    unwrap(await commands.closeRepository(path));
  },

  getOpenRepositories: async (): Promise<RepoSummary[]> => {
    if (!isTauri()) {
      return [];
    }
    return unwrap(await commands.getOpenRepositories());
  },

  getRecentRepos: async (): Promise<RecentRepoEntry[]> => {
    if (!isTauri()) {
      return [
        { path: "d:/project-v3", name: "project-v3", last_opened_at_ms: Date.now() - 3600000 },
      ];
    }
    return unwrap(await commands.getRecentRepos());
  },

  clearRecentRepos: async (): Promise<void> => {
    if (!isTauri()) return;
    await commands.clearRecentRepos();
  },

  removeRecentRepo: async (path: string): Promise<void> => {
    if (!isTauri()) return;
    await commands.removeRecentRepo(path);
  },

  selectRepoFolder: async (): Promise<string | null> => {
    if (!isTauri()) return "d:/project-v3";
    return unwrap(await commands.selectRepoFolder());
  },
};
