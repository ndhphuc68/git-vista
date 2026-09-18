import { create } from "zustand";
import { type GitHubPullRequest } from "../ipc/bindings";

interface PullRequestStoreState {
  isDrawerOpen: boolean;
  selectedPr: GitHubPullRequest | null;
  isCreateModalOpen: boolean;
  openDrawer: (pr: GitHubPullRequest) => void;
  closeDrawer: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

export const usePullRequestStore = create<PullRequestStoreState>((set) => ({
  isDrawerOpen: false,
  selectedPr: null,
  isCreateModalOpen: false,
  openDrawer: (pr) => set({ isDrawerOpen: true, selectedPr: pr }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedPr: null }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));
