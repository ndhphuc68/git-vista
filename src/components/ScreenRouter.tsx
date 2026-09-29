import React from "react";
import { Shell } from "./Shell";
import { ChangesScreen } from "./changes/ChangesScreen";
import { ConflictResolverScreen } from "./conflict/ConflictResolverScreen";
import { type ActiveScreen } from "../store/useViewStore";

interface ScreenRouterProps {
  activeScreen: ActiveScreen;
  activeConflictFile: string | null;
  repoPath: string;
  closeConflictResolver: () => void;
  onResolveAndStage: (filePath: string, content: string, onResolved: () => void) => Promise<void>;
}

/** Picks the History, Changes or Conflict-resolver screen for the active repo. */
export const ScreenRouter: React.FC<ScreenRouterProps> = ({
  activeScreen,
  activeConflictFile,
  repoPath,
  closeConflictResolver,
  onResolveAndStage,
}) => {
  if (activeScreen === "history") {
    return <Shell />;
  }

  if (activeScreen === "conflict" && activeConflictFile) {
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

  return <ChangesScreen />;
};
