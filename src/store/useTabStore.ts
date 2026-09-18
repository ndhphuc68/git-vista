import { create } from "zustand";
import { type RepoSummary } from "../ipc/bindings";
import { type TabItem, type TabSessionData } from "../types/tab";
import { invokeCommand } from "../ipc/client";
import { useRepoStore } from "./useRepoStore";
import { useViewStore } from "./useViewStore";

const SESSION_STORAGE_KEY = "gitvista_session_tabs_v1";

const createHomeTab = (): TabItem => ({
  id: "home",
  type: "home",
  activeScreen: "history",
  selectedCommitId: null,
  selectedFilePath: null,
  selectedBranch: null,
  activeConflictFile: null,
});

const createRepoTab = (repo: RepoSummary): TabItem => ({
  id: repo.path,
  type: "repo",
  repo,
  activeScreen: "history",
  selectedCommitId: null,
  selectedFilePath: null,
  selectedBranch: repo.head_branch,
  activeConflictFile: null,
});

function saveSessionToStorage(tabs: TabItem[], activeTabId: string) {
  if (typeof localStorage === "undefined") return;
  try {
    const data: TabSessionData = {
      openRepoPaths: tabs.filter((t) => t.type === "repo").map((t) => t.id),
      activeTabId,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to persist tab session:", err);
  }
}

interface TabStoreState {
  tabs: TabItem[];
  activeTabId: string;
  isRestoringSession: boolean;

  openRepoTab: (repo: RepoSummary) => void;
  openHomeTab: () => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabState: (tabId: string, partial: Partial<TabItem>) => void;
  setRepoAlias: (repoPath: string, alias: string) => void;
  getActiveTab: () => TabItem | undefined;
  restoreSession: () => Promise<void>;
  reset: () => void;
}

export const useTabStore = create<TabStoreState>((set, get) => ({
  tabs: [createHomeTab()],
  activeTabId: "home",
  isRestoringSession: false,

  openRepoTab: (repo: RepoSummary) => {
    const { tabs } = get();
    const existingIndex = tabs.findIndex((t) => t.id === repo.path);

    // Sync RepoStore immediately
    useRepoStore.getState().setRepo(repo);

    if (existingIndex >= 0) {
      // Tab already open, just switch to it and update repo summary if needed
      const tab = tabs[existingIndex];
      if (tab) {
        useViewStore.getState().setActiveScreen(tab.activeScreen || "history");
        const updatedTabs = [...tabs];
        updatedTabs[existingIndex] = {
          ...tab,
          repo,
          selectedBranch: tab.selectedBranch || repo.head_branch,
        };
        set({ tabs: updatedTabs, activeTabId: repo.path });
        saveSessionToStorage(updatedTabs, repo.path);
      }
    } else {
      useViewStore.getState().setActiveScreen("history");
      const newTab = createRepoTab(repo);
      const updatedTabs = [...tabs, newTab];
      set({ tabs: updatedTabs, activeTabId: repo.path });
      saveSessionToStorage(updatedTabs, repo.path);
    }
  },

  openHomeTab: () => {
    useRepoStore.getState().clearRepo();
    set({ activeTabId: "home" });
    saveSessionToStorage(get().tabs, "home");
  },

  closeTab: (tabId: string) => {
    if (tabId === "home") return; // Home tab cannot be closed

    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const remainingTabs = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;

    if (activeTabId === tabId) {
      // Select the adjacent tab: previous tab if available, otherwise next, fallback to home
      const prevTab = index > 0 ? tabs[index - 1] : undefined;
      const firstRemaining = remainingTabs[0];

      if (prevTab) {
        nextActiveId = prevTab.id;
      } else if (firstRemaining) {
        nextActiveId = firstRemaining.id;
      } else {
        nextActiveId = "home";
      }

      // Sync active repo state
      const nextTab = remainingTabs.find((t) => t.id === nextActiveId);
      if (nextTab && nextTab.type === "repo" && nextTab.repo) {
        useRepoStore.getState().setRepo(nextTab.repo);
      } else {
        useRepoStore.getState().clearRepo();
      }
    }

    set({ tabs: remainingTabs, activeTabId: nextActiveId });
    saveSessionToStorage(remainingTabs, nextActiveId);

    // Call backend to release file watcher and memory
    invokeCommand.closeRepository(tabId).catch((err) => {
      console.warn("Failed to close repository in backend:", err);
    });
  },

  setActiveTab: (tabId: string) => {
    const { tabs } = get();
    const targetTab = tabs.find((t) => t.id === tabId);
    if (targetTab) {
      if (targetTab.type === "repo" && targetTab.repo) {
        useRepoStore.getState().setRepo(targetTab.repo);
        if (targetTab.selectedBranch) {
          useRepoStore.getState().setSelectedBranch(targetTab.selectedBranch);
        }
        if (targetTab.activeScreen) {
          useViewStore.getState().setActiveScreen(targetTab.activeScreen);
        }
      } else if (tabId === "home") {
        useRepoStore.getState().clearRepo();
      }

      set({ activeTabId: tabId });
      saveSessionToStorage(tabs, tabId);
    }
  },

  updateTabState: (tabId: string, partial: Partial<TabItem>) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...partial } : t)),
    }));
  },

  setRepoAlias: (repoPath: string, alias: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === repoPath ? { ...t, alias } : t)),
    }));
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },

  restoreSession: async () => {
    if (typeof localStorage === "undefined") return;
    set({ isRestoringSession: true });

    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;

      const session: TabSessionData = JSON.parse(raw);
      if (!session.openRepoPaths || !Array.isArray(session.openRepoPaths)) return;

      for (const path of session.openRepoPaths) {
        try {
          const repo = await invokeCommand.openRepository(path);
          get().openRepoTab(repo);
        } catch (err) {
          console.warn(`Failed to restore repo tab for ${path}:`, err);
        }
      }

      if (session.activeTabId && get().tabs.some((t) => t.id === session.activeTabId)) {
        set({ activeTabId: session.activeTabId });
      }
    } catch (err) {
      console.warn("Error parsing or restoring session tabs:", err);
    } finally {
      set({ isRestoringSession: false });
    }
  },

  reset: () => {
    set({
      tabs: [createHomeTab()],
      activeTabId: "home",
      isRestoringSession: false,
    });
  },
}));
