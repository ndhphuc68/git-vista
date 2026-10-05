import { SCREEN_TYPE } from "../domain/enums";
import React from "react";
import { Shell } from "./Shell";
import { ChangesScreen } from "./changes/ChangesScreen";
import { ConflictResolverScreen } from "./conflict/ConflictResolverScreen";
import { PullRequestsScreen } from "../features/pullrequests";
import { type ActiveScreen } from "../store/useViewStore";

interface ScreenRouterProps {
  activeScreen: ActiveScreen;
  activeConflictFile: string | null;
  repoPath: string;
  closeConflictResolver: () => void;
  onResolveAndStage: (filePath: string, content: string, onResolved: () => void) => Promise<void>;
}

/** Picks the History, Changes, Pull Requests or Conflict-resolver screen for the active repo. */
export const ScreenRouter: React.FC<ScreenRouterProps> = ({
  activeScreen,
  activeConflictFile,
  repoPath,
  closeConflictResolver,
  onResolveAndStage,
}) => {
  if (activeScreen === SCREEN_TYPE.HISTORY) {
    return <Shell />;
  }

  if (activeScreen === SCREEN_TYPE.CONFLICT && activeConflictFile) {
    return (
      <ConflictResolverScreen
        filePath={activeConflictFile}
        repoPath={repoPath}
        onBack={closeConflictResolver}
        onSaveAndStage={(content) =>
          onResolveAndStage(activeConflictFile, content, closeConflictResolver)
        }
      />
    );
  }

  if (activeScreen === SCREEN_TYPE.PULL_REQUESTS) {
    return <PullRequestsScreen key={repoPath} repoPath={repoPath} />;
  }

  return <ChangesScreen />;
};
