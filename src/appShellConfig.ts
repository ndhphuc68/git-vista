import { SCREEN_TYPE } from "./domain/enums";
import { HOME_TAB_ID } from "./domain/constants/app";
import { type RepoSummary } from "./ipc/bindings.generated";
import { type UseGlobalShortcutsOptions } from "./hooks/useGlobalShortcuts";
import { type CommandContext } from "./utils/commandRegistry";
import { type ActiveScreen } from "./store/useViewStore";
import { type SettingsTab } from "./store/useSettingsStore";
import { usePullRequestStore } from "./store/usePullRequestStore";

export interface BuildGlobalShortcutsConfigDeps {
  repoToDisplay: RepoSummary | null;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  handleToggleTheme: () => void;
  openSettings: (tab?: SettingsTab) => void;
  handleBackToWelcome: () => void;
  activeTabId: string;
  closeTab: (tabId: string) => void;
  handleNextTab: () => void;
  handlePrevTab: () => void;
  setIsGlobalManageRemotesOpen: (open: boolean) => void;
  setIsGlobalInteractiveRebaseOpen: (open: boolean) => void;
  setIsGlobalCompareOpen: (open: boolean) => void;
  closeSettings: () => void;
  closeCommandPalette: () => void;
}

/** The app-wide keyboard shortcut handlers passed to `useGlobalShortcuts`. */
export function buildGlobalShortcutsConfig(
  deps: BuildGlobalShortcutsConfigDeps
): UseGlobalShortcutsOptions {
  const {
    repoToDisplay,
    setIsGlobalCreateBranchOpen,
    openCommandPalette,
    setIsShortcutsHelpOpen,
    handleToggleTheme,
    openSettings,
    handleBackToWelcome,
    activeTabId,
    closeTab,
    handleNextTab,
    handlePrevTab,
    setIsGlobalManageRemotesOpen,
    setIsGlobalInteractiveRebaseOpen,
    setIsGlobalCompareOpen,
    closeSettings,
    closeCommandPalette,
  } = deps;

  return {
    onOpenCreateBranch: () => {
      if (repoToDisplay) setIsGlobalCreateBranchOpen(true);
    },
    onOpenCommandPalette: () => {
      openCommandPalette();
    },
    onOpenShortcutsHelp: () => {
      setIsShortcutsHelpOpen(true);
    },
    onToggleTheme: handleToggleTheme,
    onOpenSettings: () => {
      openSettings();
    },
    onNewTab: handleBackToWelcome,
    onCloseTab: () => {
      if (activeTabId !== HOME_TAB_ID) {
        closeTab(activeTabId);
      }
    },
    onNextTab: handleNextTab,
    onPrevTab: handlePrevTab,
    onEscape: () => {
      setIsGlobalCreateBranchOpen(false);
      setIsGlobalManageRemotesOpen(false);
      setIsGlobalInteractiveRebaseOpen(false);
      setIsGlobalCompareOpen(false);
      setIsShortcutsHelpOpen(false);
      usePullRequestStore.getState().closeCreateModal();
      usePullRequestStore.getState().closeDrawer();
      closeSettings();
      closeCommandPalette();
    },
    enabled: true,
  };
}

export interface BuildCommandContextDeps {
  repoToDisplay: RepoSummary | null;
  setActiveScreen: (screen: ActiveScreen) => void;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
  setIsGlobalManageRemotesOpen: (open: boolean) => void;
  setIsGlobalInteractiveRebaseOpen: (open: boolean) => void;
  setCompareBaseRev: (rev: string | undefined) => void;
  setCompareTargetRev: (rev: string | undefined) => void;
  setIsGlobalCompareOpen: (open: boolean) => void;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  handleToggleTheme: () => void;
  openSettings: (tab?: SettingsTab) => void;
}

/** The command palette's context: what each command id does for the current repo. */
export function buildCommandContext(deps: BuildCommandContextDeps): CommandContext {
  const {
    repoToDisplay,
    setActiveScreen,
    setIsGlobalCreateBranchOpen,
    setIsGlobalManageRemotesOpen,
    setIsGlobalInteractiveRebaseOpen,
    setCompareBaseRev,
    setCompareTargetRev,
    setIsGlobalCompareOpen,
    setIsShortcutsHelpOpen,
    handleToggleTheme,
    openSettings,
  } = deps;

  return {
    repoPath: repoToDisplay?.path,
    navigate: (screen) => setActiveScreen(screen),
    openCreateBranch: () => {
      if (repoToDisplay) setIsGlobalCreateBranchOpen(true);
    },
    openManageRemotes: () => {
      if (repoToDisplay) setIsGlobalManageRemotesOpen(true);
    },
    openInteractiveRebase: () => {
      if (repoToDisplay) setIsGlobalInteractiveRebaseOpen(true);
    },
    openCompare: () => {
      if (repoToDisplay) {
        setCompareBaseRev(repoToDisplay.head_branch || "main");
        setCompareTargetRev("HEAD");
        setIsGlobalCompareOpen(true);
      }
    },
    openCreatePullRequest: () => {
      if (repoToDisplay) usePullRequestStore.getState().openCreateModal();
    },
    openPullRequests: () => {
      if (repoToDisplay) {
        setActiveScreen(SCREEN_TYPE.HISTORY);
      }
    },
    openShortcutsHelp: () => setIsShortcutsHelpOpen(true),
    toggleTheme: handleToggleTheme,
    openSettings: () => openSettings(),
  };
}
