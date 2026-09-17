import { RepoSummary } from "../ipc/bindings";

export type ScreenType = "history" | "changes" | "conflict";

export interface TabItem {
  id: string; // 'home' or canonical repo path
  type: "home" | "repo";
  repo?: RepoSummary;
  alias?: string;

  // View state per tab
  activeScreen: ScreenType;
  selectedCommitId: string | null;
  selectedFilePath: string | null;
  selectedBranch: string | null;
  activeConflictFile: string | null;
}

export interface TabSessionData {
  openRepoPaths: string[];
  activeTabId: string;
}
