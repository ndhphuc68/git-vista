import React from "react";
import { type RepoSummary } from "../ipc/bindings.generated";
import { type CommandContext } from "../utils/commandRegistry";
import { WindowTabBar } from "./header/WindowTabBar";
import { WelcomeScreen } from "../features/welcome";
import { AppOverlays } from "./AppOverlays";

interface RepoContentSlotProps {
  currentRepo: RepoSummary;
  clearRepo: () => void;
  isGlobalCreateBranchOpen: boolean;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
}

interface AppShellBodyProps {
  repoToDisplay: RepoSummary | null;
  handleBackToWelcome: () => void;
  handleSelectRepo: (repo: RepoSummary) => void;
  RepoContent: React.FC<RepoContentSlotProps>;
  isGlobalCreateBranchOpen: boolean;
  setIsGlobalCreateBranchOpen: (open: boolean) => void;
  commandContext: CommandContext;
  isShortcutsHelpOpen: boolean;
  onCloseShortcutsHelp: () => void;
  isManageRemotesOpen: boolean;
  onCloseManageRemotes: () => void;
  isInteractiveRebaseOpen: boolean;
  onCloseInteractiveRebase: () => void;
  onRebaseSuccess: () => void;
  isCompareOpen: boolean;
  onCloseCompare: () => void;
  compareBaseRev: string | undefined;
  compareTargetRev: string | undefined;
}

/**
 * The app shell's main workspace: window tabs, the active repo (or the
 * welcome screen), and the global overlay layer.
 */
export const AppShellBody: React.FC<AppShellBodyProps> = ({
  repoToDisplay,
  handleBackToWelcome,
  handleSelectRepo,
  isGlobalCreateBranchOpen,
  setIsGlobalCreateBranchOpen,
  RepoContent,
  commandContext,
  isShortcutsHelpOpen,
  onCloseShortcutsHelp,
  isManageRemotesOpen,
  onCloseManageRemotes,
  isInteractiveRebaseOpen,
  onCloseInteractiveRebase,
  onRebaseSuccess,
  isCompareOpen,
  onCloseCompare,
  compareBaseRev,
  compareTargetRev,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Window Tab Bar */}
      <WindowTabBar onNewTab={handleBackToWelcome} />

      {/* Main Workspace Area */}
      {repoToDisplay ? (
        <RepoContent
          currentRepo={repoToDisplay}
          clearRepo={handleBackToWelcome}
          isGlobalCreateBranchOpen={isGlobalCreateBranchOpen}
          setIsGlobalCreateBranchOpen={setIsGlobalCreateBranchOpen}
        />
      ) : (
        <WelcomeScreen onSelectRepo={handleSelectRepo} />
      )}
      <AppOverlays
        commandContext={commandContext}
        isShortcutsHelpOpen={isShortcutsHelpOpen}
        onCloseShortcutsHelp={onCloseShortcutsHelp}
        repoToDisplay={repoToDisplay}
        isManageRemotesOpen={isManageRemotesOpen}
        onCloseManageRemotes={onCloseManageRemotes}
        isInteractiveRebaseOpen={isInteractiveRebaseOpen}
        onCloseInteractiveRebase={onCloseInteractiveRebase}
        onRebaseSuccess={onRebaseSuccess}
        isCompareOpen={isCompareOpen}
        onCloseCompare={onCloseCompare}
        compareBaseRev={compareBaseRev}
        compareTargetRev={compareTargetRev}
      />
    </div>
  );
};
