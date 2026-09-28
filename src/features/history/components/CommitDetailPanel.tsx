import React, { useCallback, useEffect, useState } from "react";
import { GitCommit, Check, Copy, X } from "lucide-react";
import { useRepoStore } from "../../../store/useRepoStore";
import { useLayoutStore } from "../../../store/useLayoutStore";
import { useTranslation } from "../../../i18n";
import { useCommitDetails } from "../api/useCommitDetails";
import { useCommitFileNavigation } from "../hooks/useCommitFileNavigation";
import { CommitMetadata } from "./CommitMetadata";
import { CommitFileList } from "./CommitFileList";
import { CommitFileDiff } from "./CommitFileDiff";

interface CommitDetailPanelProps {
  onClose?: () => void;
}

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { currentRepo, selectedCommitId, setSelectedCommit, selectedFilePath, setSelectedFile } =
    useRepoStore();
  const { setDetailPanelOpen } = useLayoutStore();

  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedFilePath, setCopiedFilePath] = useState(false);

  const [filesWidth, setFilesWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("git-vista:commit-detail-files-width");
      const parsed = saved ? parseInt(saved, 10) : 340;
      return isNaN(parsed) || parsed < 260 || parsed > 600 ? 340 : parsed;
    } catch {
      return 340;
    }
  });

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
        localStorage.setItem("git-vista:commit-detail-files-width", String(newWidth));
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

  if (!selectedCommitId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2 p-6">
        <GitCommit size={28} className="opacity-40" />
        <span className="font-medium">{t.diff.selectCommitPrompt}</span>
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div className="p-8 text-secondary text-xs flex items-center justify-center gap-3 h-full">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{t.diff.loadingCommitDetails}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-hidden select-none">
      {/* Top Drawer Header Bar */}
      <div className="h-13 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-1.5 rounded-md bg-accent/10 text-accent shrink-0 ring-1 ring-accent/20">
            <GitCommit size={17} />
          </span>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-sm text-primary tracking-tight">
              {t.diff.commitDetailsTitle}
            </span>
            <button
              type="button"
              onClick={() => handleCopySha(details.id)}
              className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover text-accent font-semibold cursor-pointer transition-colors shadow-2xs"
              title={t.diff.copyShaTooltip}
            >
              <span>{details.id.substring(0, 7)}</span>
              {copiedSha ? <Check size={12} className="text-diff-add-text" /> : <Copy size={12} />}
            </button>
            <span className="text-tertiary text-xs">|</span>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <span className="px-1.5 py-0.5 rounded bg-diff-add-bg text-diff-add-text border border-diff-add-border">
                {`+${details.total_additions}`}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border">
                {`-${details.total_deletions}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.diff.closeDetailAria}
            title={t.diff.closeDetailTitle}
            className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-hover active:bg-surface-active text-secondary hover:text-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-border-subtle shadow-2xs"
          >
            <span>Đóng</span>
            <kbd className="text-[10px] font-mono text-tertiary bg-window px-1 rounded border border-border-subtle">
              Esc
            </kbd>
            <X size={13} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* 2-Column Split: Left = Files & Info, Right = Diff Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Commit Summary & File List */}
        <div
          style={{ width: `${filesWidth}px` }}
          className="border-r border-border-subtle bg-window flex flex-col shrink-0 overflow-hidden"
        >
          <CommitMetadata details={details} />
          <CommitFileList
            files={details.files}
            filteredFiles={navigation.filteredFiles}
            fileFilter={navigation.fileFilter}
            setFileFilter={navigation.setFileFilter}
            selectedFilePath={selectedFilePath}
            setSelectedFile={setSelectedFile}
            selectedCommitId={selectedCommitId}
          />
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          onDoubleClick={() => setFilesWidth(340)}
          className="w-1 hover:w-1.5 -mr-0.5 h-full cursor-col-resize z-10 transition-all group shrink-0 relative select-none hover:bg-accent active:bg-accent border-r border-border-subtle hover:border-accent"
          title={t.diff.resizerTooltip}
        >
          <div className="w-full h-full" />
        </div>

        <CommitFileDiff
          repoPath={currentRepo?.path}
          selectedCommitId={selectedCommitId}
          selectedFile={navigation.selectedFile}
          fileCount={details.files.length}
          currentFileIndex={navigation.currentFileIndex}
          hasPrev={navigation.hasPrev}
          hasNext={navigation.hasNext}
          handlePrevFile={navigation.handlePrevFile}
          handleNextFile={navigation.handleNextFile}
          copiedFilePath={copiedFilePath}
          handleCopyFilePath={handleCopyFilePath}
        />
      </div>
    </div>
  );
};
