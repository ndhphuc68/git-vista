import { type QueryClient } from "@tanstack/react-query";
import { type RepoSummary } from "../ipc/bindings.generated";
import { type ActiveScreen } from "../store/useViewStore";
import { type SettingsTab, type Theme } from "../store/useSettingsStore";
import { qk } from "../domain/queryKeys";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { buildGlobalShortcutsConfig, buildCommandContext } from "../appShellConfig";
import { useAppDialogState } from "./useAppDialogState";

export interface UseAppShellControlsDeps {
  repoToDisplay: RepoSummary | null;
  activeTabId: string;
  closeTab: (tabId: string) => void;
  handleBackToWelcome: () => void;
  handleNextTab: () => void;
  handlePrevTab: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  queryClient: QueryClient;
}

/**
 * The app shell's global dialog visibility state, its keyboard shortcuts,
 * and the command palette context and overlay callbacks built from that
 * same state.
 */
export function useAppShellControls(deps: UseAppShellControlsDeps) {
  const { repoToDisplay, resolvedTheme, setTheme, openSettings, queryClient } = deps;

  const d = useAppDialogState();

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useGlobalShortcuts(
    buildGlobalShortcutsConfig({
      repoToDisplay,
      setIsGlobalCreateBranchOpen: d.setIsGlobalCreateBranchOpen,
      openCommandPalette: deps.openCommandPalette,
      setIsShortcutsHelpOpen: d.setIsShortcutsHelpOpen,
      handleToggleTheme,
      openSettings,
      handleBackToWelcome: deps.handleBackToWelcome,
      activeTabId: deps.activeTabId,
      closeTab: deps.closeTab,
      handleNextTab: deps.handleNextTab,
      handlePrevTab: deps.handlePrevTab,
      setIsGlobalManageRemotesOpen: d.setIsManageRemotesOpen,
      setIsGlobalInteractiveRebaseOpen: d.setIsInteractiveRebaseOpen,
      setIsGlobalCompareOpen: d.setIsCompareOpen,
      closeSettings: deps.closeSettings,
      closeCommandPalette: deps.closeCommandPalette,
    })
  );

  const commandContext = buildCommandContext({
    repoToDisplay,
    setActiveScreen: deps.setActiveScreen,
    setIsGlobalCreateBranchOpen: d.setIsGlobalCreateBranchOpen,
    setIsGlobalManageRemotesOpen: d.setIsManageRemotesOpen,
    setIsGlobalInteractiveRebaseOpen: d.setIsInteractiveRebaseOpen,
    setCompareBaseRev: d.setCompareBaseRev,
    setCompareTargetRev: d.setCompareTargetRev,
    setIsGlobalCompareOpen: d.setIsCompareOpen,
    setIsShortcutsHelpOpen: d.setIsShortcutsHelpOpen,
    handleToggleTheme,
    openSettings,
  });

  return {
    isGlobalCreateBranchOpen: d.isGlobalCreateBranchOpen,
    setIsGlobalCreateBranchOpen: d.setIsGlobalCreateBranchOpen,
    commandContext,
    isShortcutsHelpOpen: d.isShortcutsHelpOpen,
    onCloseShortcutsHelp: () => d.setIsShortcutsHelpOpen(false),
    isManageRemotesOpen: d.isManageRemotesOpen,
    onCloseManageRemotes: () => d.setIsManageRemotesOpen(false),
    isInteractiveRebaseOpen: d.isInteractiveRebaseOpen,
    onCloseInteractiveRebase: () => d.setIsInteractiveRebaseOpen(false),
    onRebaseSuccess: () => {
      d.setIsInteractiveRebaseOpen(false);
      // Interactive rebase on the current repo: only refresh this repo's cache
      queryClient.invalidateQueries({ queryKey: qk.repo.all(repoToDisplay?.path ?? "") });
    },
    isCompareOpen: d.isCompareOpen,
    onCloseCompare: () => d.setIsCompareOpen(false),
    compareBaseRev: d.compareBaseRev,
    compareTargetRev: d.compareTargetRev,
  };
}
