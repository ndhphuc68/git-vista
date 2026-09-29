import { useEffect } from "react";
import { type RepoSummary } from "../ipc/bindings.generated";
import { type TabItem } from "../types/tab";

/**
 * Keeps repoStore in sync with the active tab (for backward compatibility
 * with all child components that still read repoStore directly), and
 * restores the previous session's tabs on app startup.
 */
export function useAppTabSync(
  tabs: TabItem[],
  activeTabId: string,
  setRepo: (repo: RepoSummary) => void,
  clearRepo: () => void,
  restoreSession: () => void
) {
  // Sync the active tab into repoStore for backward compatibility with all child components
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.type === "repo" && activeTab.repo) {
      setRepo(activeTab.repo);
    } else if (activeTabId === "home") {
      clearRepo();
    }
  }, [activeTabId, tabs, setRepo, clearRepo]);

  // Restore the previous session on app startup
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);
}
