import React, { useCallback, useEffect, useState } from "react";
import { useRepoStore } from "../../../store/useRepoStore";
import { useLayoutStore } from "../../../store/useLayoutStore";
import { useCommitDetails } from "../api/useCommitDetails";
import { useCommitFileNavigation } from "./useCommitFileNavigation";

const FILES_WIDTH_STORAGE_KEY = "git-vista:commit-detail-files-width";

function readStoredFilesWidth(): number {
  try {
    const saved = localStorage.getItem(FILES_WIDTH_STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : 340;
    return isNaN(parsed) || parsed < 260 || parsed > 600 ? 340 : parsed;
  } catch {
    return 340;
  }
}

/** All state, effects and derived values CommitDetailPanel's JSX reads. */
export function useCommitDetailPanelState(onClose?: () => void) {
  const { currentRepo, selectedCommitId, setSelectedCommit, selectedFilePath, setSelectedFile } =
    useRepoStore();
  const { setDetailPanelOpen } = useLayoutStore();

  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedFilePath, setCopiedFilePath] = useState(false);
  const [filesWidth, setFilesWidth] = useState<number>(readStoredFilesWidth);

  const { data: details, isLoading } = useCommitDetails(currentRepo?.path, selectedCommitId);
  const navigation = useCommitFileNavigation(details?.files, selectedFilePath, setSelectedFile);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setDetailPanelOpen(false);
      setSelectedCommit(null);
    }
  }, [onClose, setDetailPanelOpen, setSelectedCommit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopyFilePath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedFilePath(true);
    setTimeout(() => setCopiedFilePath(false), 2000);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = filesWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 260), 600);
      setFilesWidth(newWidth);
      try {
        localStorage.setItem(FILES_WIDTH_STORAGE_KEY, String(newWidth));
      } catch {
        // ignore
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return {
    currentRepo,
    selectedCommitId,
    selectedFilePath,
    setSelectedFile,
    details,
    isLoading,
    navigation,
    copiedSha,
    copiedFilePath,
    filesWidth,
    setFilesWidth,
    handleClose,
    handleCopySha,
    handleCopyFilePath,
    handleResizeMouseDown,
  };
}
