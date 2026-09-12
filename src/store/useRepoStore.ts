import { create } from "zustand";
import { RepoSummary } from "../ipc/bindings";

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

  setRepo: (repo) =>
    set({
      currentRepo: repo,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: repo.head_branch,
    }),

  setSelectedCommit: (commitId) =>
    set({
      selectedCommitId: commitId,
      selectedFilePath: null,
    }),

  setSelectedFile: (filePath) => set({ selectedFilePath: filePath }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  clearRepo: () =>
    set({
      currentRepo: null,
      selectedCommitId: null,
      selectedFilePath: null,
      selectedBranch: null,
    }),
}));
