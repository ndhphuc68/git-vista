/**
 * tag IPC commands.
 *
 * Thin wrappers over the generated bindings, with the browser dev fallbacks
 * these commands had before they moved out of client.ts.
 */
import { commands, type TagItem } from "./bindings.generated";
import { isTauri, unwrap } from "./core";
import { mockState } from "./mocks";

export const tagCommands = {
  getTags: async (repoPath: string): Promise<TagItem[]> => {
    if (!isTauri()) {
      return [...mockState.tags];
    }
    return unwrap(await commands.getTags(repoPath));
  },

  createTag: async (
    repoPath: string,
    name: string,
    targetCommit: string,
    message?: string
  ): Promise<void> => {
    if (!isTauri()) {
      const isAnnotated = Boolean(message && message.trim().length > 0);
      const newTag: TagItem = {
        name,
        target_commit_id: targetCommit,
        short_commit_id: targetCommit.slice(0, 7),
        commit_summary: message || "Tag created",
        is_annotated: isAnnotated,
        message: message ?? null,
        tagger_name: isAnnotated ? "GitVista User" : null,
        tagger_email: isAnnotated ? "user@gitvista.dev" : null,
        timestamp_sec: Math.floor(Date.now() / 1000),
      };
      mockState.tags = [newTag, ...mockState.tags.filter((t) => t.name !== name)];
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Tag ${name} created`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.createTag(repoPath, name, targetCommit, message ?? null);
  },

  deleteTag: async (repoPath: string, name: string, deleteRemote?: boolean): Promise<void> => {
    if (!isTauri()) {
      mockState.tags = mockState.tags.filter((t) => t.name !== name);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Tag ${name} deleted`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.deleteTag(repoPath, name, deleteRemote ?? null);
  },

  checkoutTag: async (repoPath: string, name: string): Promise<void> => {
    if (!isTauri()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mock-repo-changed", {
            detail: {
              repo_path: repoPath,
              reason: `Checked out tag ${name}`,
              timestamp_ms: Date.now(),
            },
          })
        );
      }
      return;
    }
    await commands.checkoutTag(repoPath, name);
  },

  pushTag: async (repoPath: string, name: string, remoteName?: string): Promise<void> => {
    if (!isTauri()) {
      return;
    }
    await commands.pushTag(repoPath, name, remoteName ?? null);
  },
};
