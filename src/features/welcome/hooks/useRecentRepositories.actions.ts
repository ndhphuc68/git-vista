import type { QueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { qk } from "../../../domain/queryKeys";
import { clearRecentRepos, openRepository, removeRecentRepo, selectRepoFolder } from "../api";
import { messageOf } from "../../../shared/utils/toError";
import type { Translations } from "../../../i18n/vi";

const PINNED_REPOS_STORAGE_KEY = "gitvista_pinned_repos";

export function loadPinnedPaths(): string[] {
  try {
    const saved =
      typeof localStorage !== "undefined" && localStorage.getItem(PINNED_REPOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export interface RecentRepositoriesActionsContext {
  t: Translations;
  queryClient: QueryClient;
  onSelectRepo: (repo: RepoSummary) => void;
  setError: (value: string | null) => void;
  setCopiedPath: (value: string | null) => void;
  setPinnedPaths: Dispatch<SetStateAction<string[]>>;
}

export function createOpenFolderHandler(context: RecentRepositoriesActionsContext) {
  return async () => {
    try {
      context.setError(null);
      const path = await selectRepoFolder();
      if (path) {
        const summary = await openRepository(path);
        context.onSelectRepo(summary);
      }
    } catch (err: unknown) {
      context.setError(messageOf(err) || context.t.welcome.errorOpen);
    }
  };
}

export function createOpenRecentHandler(context: RecentRepositoriesActionsContext) {
  return async (path: string) => {
    try {
      context.setError(null);
      const summary = await openRepository(path);
      context.onSelectRepo(summary);
    } catch (err: unknown) {
      context.setError(messageOf(err) || `${context.t.welcome.errorRecent}${path}`);
    }
  };
}

export function createClearRecentsHandler(context: RecentRepositoriesActionsContext) {
  return async () => {
    try {
      await clearRecentRepos();
      await context.queryClient.invalidateQueries({ queryKey: qk.recentRepos() });
    } catch (err) {
      console.warn("Error clearing recents:", err);
    }
  };
}

export function createRemoveRecentHandler(context: RecentRepositoriesActionsContext) {
  return async (path: string) => {
    try {
      await removeRecentRepo(path);
      await context.queryClient.invalidateQueries({ queryKey: qk.recentRepos() });
    } catch (err) {
      console.warn("Error removing recent repo:", err);
    }
  };
}

export function createCopyPathHandler(context: RecentRepositoriesActionsContext) {
  return async (path: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(path);
      }
      context.setCopiedPath(path);
      setTimeout(() => context.setCopiedPath(null), 2000);
    } catch (err) {
      console.warn("Error copying path:", err);
    }
  };
}

export function createTogglePinHandler(context: RecentRepositoriesActionsContext) {
  return (path: string) => {
    context.setPinnedPaths((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(PINNED_REPOS_STORAGE_KEY, JSON.stringify(next));
        }
      } catch (err) {
        console.warn("Error saving pinned repos:", err);
      }
      return next;
    });
  };
}
