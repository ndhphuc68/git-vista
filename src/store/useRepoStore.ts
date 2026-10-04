import { create } from "zustand";
import { type RepoSummary } from "../ipc/bindings.generated";
import { usePullRequestStore } from "./usePullRequestStore";

interface RepoState {
  currentRepo: RepoSummary | null;
  selectedCommitId: string | null;
  selectedFilePath: string | null;
  selectedBranch: string | null;

  setRepo: (repo: RepoSummary) => void;
  setSelectedCommit: (commitId: string | null) => void;
  setSelectedFile: (filePath: string | null) => void;
  setSelectedBranch: (branch: string | null) => void;
  clearRepo: () => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  currentRepo: null,
  selectedCommitId: null,
  selectedFilePath: null,
  selectedBranch: null,

  setRepo: (repo) => {
    usePullRequestStore.getState().closeDrawer();
    usePullRequestStore.getState().setSelectedPr(null, repo.path);
    set({
      currentRepo: repo,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: repo.head_branch,
    });
  },

  setSelectedCommit: (commitId) =>
    set({
      selectedCommitId: commitId,
      selectedFilePath: null,
    }),

  setSelectedFile: (filePath) => set({ selectedFilePath: filePath }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  clearRepo: () => {
    usePullRequestStore.getState().closeDrawer();
    usePullRequestStore.getState().setSelectedPr(null, null);
    set({
      currentRepo: null,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: null,
    });
  },
}));
