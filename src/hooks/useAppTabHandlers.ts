import { useCallback } from "react";
import { type RepoSummary } from "../ipc/bindings.generated";
import { type TabItem } from "../types/tab";

export interface UseAppTabHandlersDeps {
  tabs: TabItem[];
  activeTabId: string;
  setActiveTab: (tabId: string) => void;
  openRepoTab: (repo: RepoSummary) => void;
  openHomeTab: () => void;
  setRepo: (repo: RepoSummary) => void;
  clearRepo: () => void;
}

/**
 * Tab navigation handlers for the app shell: select a repo (opens/activates
 * its tab), go back to the Home tab, and cycle to the next/previous tab.
 */
export function useAppTabHandlers(deps: UseAppTabHandlersDeps) {
  const { tabs, activeTabId, setActiveTab, openRepoTab, openHomeTab, setRepo, clearRepo } = deps;

  const handleSelectRepo = useCallback(
    (repo: RepoSummary) => {
      openRepoTab(repo);
      setRepo(repo);
    },
    [openRepoTab, setRepo]
  );

  const handleBackToWelcome = useCallback(() => {
    openHomeTab();
    clearRepo();
  }, [openHomeTab, clearRepo]);

  const handleNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex >= 0 && tabs.length > 1) {
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (nextTab) setActiveTab(nextTab.id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  const handlePrevTab = useCallback(() => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex >= 0 && tabs.length > 1) {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      const prevTab = tabs[prevIndex];
      if (prevTab) setActiveTab(prevTab.id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  return { handleSelectRepo, handleBackToWelcome, handleNextTab, handlePrevTab };
}
