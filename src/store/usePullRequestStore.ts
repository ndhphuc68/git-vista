import { create } from "zustand";
import { type GitHubPullRequest } from "../ipc/githubApi";

interface PullRequestStoreState {
  isDrawerOpen: boolean;
  selectedPr: GitHubPullRequest | null;
  selectedRepoPath: string | null;
  isCreateModalOpen: boolean;
  openDrawer: (pr: GitHubPullRequest, repoPath?: string | null) => void;
  closeDrawer: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  setSelectedPr: (pr: GitHubPullRequest | null, repoPath?: string | null) => void;
}

export const usePullRequestStore = create<PullRequestStoreState>((set) => ({
  isDrawerOpen: false,
  selectedPr: null,
  selectedRepoPath: null,
  isCreateModalOpen: false,
  openDrawer: (pr, repoPath) =>
    set({
      isDrawerOpen: true,
      selectedPr: pr,
      selectedRepoPath: repoPath !== undefined ? repoPath : null,
    }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedPr: null, selectedRepoPath: null }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  setSelectedPr: (pr, repoPath) =>
    set((state) => ({
      selectedPr: pr,
      selectedRepoPath: repoPath !== undefined ? repoPath : pr ? state.selectedRepoPath : null,
    })),
}));
