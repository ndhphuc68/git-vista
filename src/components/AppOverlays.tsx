import React from "react";
import { type RepoSummary } from "../ipc/bindings.generated";
import { ToastContainer } from "./toast/ToastContainer";
import { GlobalLoadingIndicator } from "./common/GlobalLoadingIndicator";
import { CommandPalette } from "./palette/CommandPalette";
import { ShortcutsHelpModal } from "./shortcuts/ShortcutsHelpModal";
import { SettingsModal } from "./settings/SettingsModal";
import { ManageRemotesModal } from "../features/remote";
import { InteractiveRebaseModal } from "./rebase";
import { CompareModal } from "./compare";
import { useRepoStore } from "../store/useRepoStore";
import { type CommandContext } from "../utils/commandRegistry";

interface AppOverlaysProps {
  commandContext: CommandContext;
  isShortcutsHelpOpen: boolean;
  onCloseShortcutsHelp: () => void;
  repoToDisplay: RepoSummary | null;
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
 * The app's global overlay layer: loading indicator, toasts, command palette, shortcuts help,
 * settings, and the repo-scoped manage-remotes/rebase/compare modals.
 */
export const AppOverlays: React.FC<AppOverlaysProps> = ({
  commandContext,
  isShortcutsHelpOpen,
  onCloseShortcutsHelp,
  repoToDisplay,
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
    <>
      <GlobalLoadingIndicator />
      <ToastContainer />
      <CommandPalette context={commandContext} />
      <ShortcutsHelpModal isOpen={isShortcutsHelpOpen} onClose={onCloseShortcutsHelp} />
      <SettingsModal currentRepoPath={repoToDisplay?.path ?? null} />
      {repoToDisplay && (
        <ManageRemotesModal
          isOpen={isManageRemotesOpen}
          onClose={onCloseManageRemotes}
          repoPath={repoToDisplay.path}
        />
      )}
      {repoToDisplay && (
        <InteractiveRebaseModal
          isOpen={isInteractiveRebaseOpen}
          onClose={onCloseInteractiveRebase}
          repoPath={repoToDisplay.path}
          baseCommitId={useRepoStore.getState().selectedCommitId || "HEAD~5"}
          onRebaseSuccess={onRebaseSuccess}
        />
      )}
      {repoToDisplay && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={onCloseCompare}
          repoPath={repoToDisplay.path}
          initialBaseRev={compareBaseRev}
          initialTargetRev={compareTargetRev}
        />
      )}
    </>
  );
};
