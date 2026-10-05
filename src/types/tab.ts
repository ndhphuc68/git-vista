import { type RepoSummary } from "../ipc/bindings.generated";
import type { ScreenType, TabType } from "../domain/enums";

export type { ScreenType };

export interface TabItem {
  id: string; // HOME_TAB_ID or canonical repo path
  type: TabType;
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
