import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { useViewStore } from "../../store/useViewStore";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import { useSaveStash } from "../../features/stash/api";
import { useRepoStatus } from "../../features/history";
import { useTranslation } from "../../i18n";
import { type SelectedWorkingFile } from "./StagingFileList";
import {
  createSelectFileHandler,
  createStageFileHandler,
  createUnstageFileHandler,
  createStageAllHandler,
  createUnstageAllHandler,
  createDiscardFileHandler,
  createStageHunkHandler,
  createUnstageHunkHandler,
  createStageLinesHandler,
  createUnstageLinesHandler,
  createCommitHandler,
} from "./useChangesScreen.actions";

/** Auto-selects the first available file when none is selected or the previous one disappeared. */
function useAutoSelectFile(
  status: ReturnType<typeof useRepoStatus>["data"],
  selectedFile: SelectedWorkingFile | null,
  setSelectedFile: (file: SelectedWorkingFile | null) => void
) {
  useEffect(() => {
    if (!status) return;

    const allFiles: SelectedWorkingFile[] = [
      ...status.staged.map((f) => ({ path: f.path, is_staged: true })),
      ...status.unstaged.map((f) => ({ path: f.path, is_staged: false })),
      ...status.untracked.map((f) => ({ path: f.path, is_staged: false })),
    ];

    if (allFiles.length === 0) {
      setSelectedFile(null);
      return;
    }

    const stillExists =
      selectedFile &&
      allFiles.some((f) => f.path === selectedFile.path && f.is_staged === selectedFile.is_staged);
    if (!stillExists) {
      const first = allFiles[0];
      if (first) {
        setSelectedFile(first);
      }
    }
  }, [status, selectedFile, setSelectedFile]);
}

/**
 * State, effects and handlers for `ChangesScreen`. Keeps the component itself
 * down to layout: which sections are visible and what they're passed.
 */
export function useChangesScreen() {
  const { t } = useTranslation();
  const { currentRepo } = useRepoStore();
  const { sidebarOpen, activeChangesView, setActiveChangesView } = useLayoutStore();
  const { openConflictResolver } = useViewStore();
  const { isMobile, isLaptop } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<SelectedWorkingFile | null>(null);
  const [showCreateStash, setShowCreateStash] = useState(false);
  const repoPath = currentRepo?.path ?? "";
  const saveStash = useSaveStash(repoPath);

  const { data: status } = useRepoStatus(repoPath);

  useAutoSelectFile(status, selectedFile, setSelectedFile);

  const handlers = {
    handleSelectFile: createSelectFileHandler({ setSelectedFile, isMobile, setActiveChangesView }),
    handleStageFile: createStageFileHandler({ repoPath, setSelectedFile, queryClient }),
    handleUnstageFile: createUnstageFileHandler({ repoPath, setSelectedFile, queryClient }),
    handleStageAll: createStageAllHandler({ repoPath, queryClient }),
    handleUnstageAll: createUnstageAllHandler({ repoPath, queryClient }),
    handleDiscardFile: createDiscardFileHandler({ repoPath, t, queryClient }),
    handleStageHunk: createStageHunkHandler({ repoPath, selectedFile, queryClient }),
    handleUnstageHunk: createUnstageHunkHandler({ repoPath, selectedFile, queryClient }),
    handleStageLines: createStageLinesHandler({ repoPath, selectedFile, queryClient }),
    handleUnstageLines: createUnstageLinesHandler({ repoPath, selectedFile, queryClient }),
    handleCommit: createCommitHandler({ repoPath, queryClient }),
  };

  return {
    t,
    currentRepo,
    sidebarOpen,
    activeChangesView,
    setActiveChangesView,
    openConflictResolver,
    isMobile,
    isLaptop,
    status,
    selectedFile,
    showCreateStash,
    setShowCreateStash,
    saveStash,
    queryClient,
    handlers,
  };
}
