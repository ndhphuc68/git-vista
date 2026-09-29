import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type RepoSummary } from "../../../ipc/bindings.generated";
import { useTranslation } from "../../../i18n";
import { qk } from "../../../domain/queryKeys";
import { getRecentRepos } from "../api";
import { sortRecentRepositories } from "../model/recentRepositories";
import {
  createClearRecentsHandler,
  createCopyPathHandler,
  createOpenFolderHandler,
  createOpenRecentHandler,
  createRemoveRecentHandler,
  createTogglePinHandler,
  loadPinnedPaths,
} from "./useRecentRepositories.actions";

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

  const actionsContext = { t, queryClient, onSelectRepo, setError, setCopiedPath, setPinnedPaths };
  const openFolder = createOpenFolderHandler(actionsContext);
  const openRecent = createOpenRecentHandler(actionsContext);
  const clearRecents = createClearRecentsHandler(actionsContext);
  const removeRecent = createRemoveRecentHandler(actionsContext);
  const copyPath = createCopyPathHandler(actionsContext);
  const togglePin = createTogglePinHandler(actionsContext);

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
