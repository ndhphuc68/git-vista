import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { qk } from "../../../domain/queryKeys";
import {
  clearRecentRepos,
  getRecentRepos,
  openRepository,
  removeRecentRepo,
  selectRepoFolder,
} from "../api";
import { sortRecentRepositories } from "../model/recentRepositories";

const PINNED_REPOS_STORAGE_KEY = "gitvista_pinned_repos";

function loadPinnedPaths(): string[] {
  try {
    const saved =
      typeof localStorage !== "undefined" && localStorage.getItem(PINNED_REPOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Owns the whole recent-repositories lifecycle for the welcome screen:
 * fetching, opening (via folder picker, a recent entry, or drag-and-drop),
 * clearing, removing, pinning, copying a path, search filtering, and cache
 * invalidation. Moved intact from the old `WelcomeScreen` component.
 */
export function useRecentRepositories(onSelectRepo: (repo: RepoSummary) => void) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [pinnedPaths, setPinnedPaths] = useState<string[]>(loadPinnedPaths);

  const { data: recents = [], isLoading } = useQuery({
    queryKey: qk.recentRepos(),
    queryFn: () => getRecentRepos(),
  });

  const sortedRecents = useMemo(
    () => sortRecentRepositories(recents, pinnedPaths, searchQuery),
    [recents, searchQuery, pinnedPaths]
  );

  const openFolder = async () => {
    try {
      setError(null);
      const path = await selectRepoFolder();
      if (path) {
        const summary = await openRepository(path);
        onSelectRepo(summary);
      }
    } catch (err: any) {
      setError(err?.message || t.welcome.errorOpen);
    }
  };

  const openRecent = async (path: string) => {
    try {
      setError(null);
      const summary = await openRepository(path);
      onSelectRepo(summary);
    } catch (err: any) {
      setError(err?.message || `${t.welcome.errorRecent}${path}`);
    }
  };

  const clearRecents = async () => {
    try {
      await clearRecentRepos();
      await queryClient.invalidateQueries({ queryKey: qk.recentRepos() });
    } catch (err) {
      console.warn("Error clearing recents:", err);
    }
  };

  const removeRecent = async (path: string) => {
    try {
      await removeRecentRepo(path);
      await queryClient.invalidateQueries({ queryKey: qk.recentRepos() });
    } catch (err) {
      console.warn("Error removing recent repo:", err);
    }
  };

  const copyPath = async (path: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(path);
      }
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.warn("Error copying path:", err);
    }
  };

  const togglePin = (path: string) => {
    setPinnedPaths((prev) => {
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

  return {
    error,
    setError,
    searchQuery,
    setSearchQuery,
    copiedPath,
    pinnedPaths,
    recents,
    sortedRecents,
    isLoading,
    openFolder,
    openRecent,
    clearRecents,
    removeRecent,
    copyPath,
    togglePin,
  };
}
