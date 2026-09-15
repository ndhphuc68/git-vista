import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { GitCommit, FileText, Check, Copy, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { invokeCommand } from "../../ipc/client";
import { FileDiffViewer } from "./FileDiffViewer";

interface CommitDetailPanelProps {
  onClose?: () => void;
}

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({ onClose }) => {
  const { currentRepo, selectedCommitId, setSelectedCommit, selectedFilePath, setSelectedFile } = useRepoStore();
  const { setDetailPanelOpen } = useLayoutStore();
  const [copiedSha, setCopiedSha] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ["commit-details", currentRepo?.path, selectedCommitId],
    queryFn: () => invokeCommand.getCommitDetails(currentRepo!.path, selectedCommitId!),
    enabled: Boolean(currentRepo && selectedCommitId),
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setDetailPanelOpen(false);
      setSelectedCommit(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const firstFile = details?.files[0];
    if (firstFile && !selectedFilePath) {
      setSelectedFile(firstFile.path);
    }
  }, [details, selectedFilePath, setSelectedFile]);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  if (!selectedCommitId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2 p-6">
        <GitCommit size={24} className="opacity-40" />
        <span>Chọn một commit để xem chi tiết và diff</span>
      </div>
    );
  }

  if (isLoading || !details) {
    return (
      <div className="p-6 text-secondary text-xs flex items-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Đang tải thông tin commit...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface overflow-hidden select-none">
      {/* Drawer Header Bar */}
      <div className="h-12 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1 rounded-md bg-accent/10 text-accent shrink-0">
            <GitCommit size={16} />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm text-primary">Chi tiết Commit</span>
            <button
              type="button"
              onClick={() => handleCopySha(details.id)}
              className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover text-accent font-semibold cursor-pointer transition-colors"
              title="Nhấp để sao chép mã SHA đầy đủ"
            >
              <span>{details.id.substring(0, 7)}</span>
              {copiedSha ? <Check size={11} className="text-diff-add-text" /> : <Copy size={11} />}
            </button>
            <span className="text-tertiary text-xs">|</span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <span className="text-diff-add-text">{`+${details.total_additions}`}</span>
              <span className="text-diff-remove-text">{`-${details.total_deletions}`}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng chi tiết commit"
            title="Đóng chi tiết commit (Phím Esc)"
            className="px-2.5 py-1 rounded-md bg-surface-hover hover:bg-border-subtle text-secondary hover:text-primary text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-border-subtle"
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
        <div className="w-64 border-r border-border-subtle bg-window flex flex-col shrink-0 overflow-hidden">
          {/* Commit Message & Author Card */}
          <div className="p-3 border-b border-border-subtle bg-surface flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-primary leading-snug break-words">
              {details.full_message}
            </h3>

            <div className="flex items-center gap-2 pt-1 text-secondary text-[11px] border-t border-border-subtle">
              <div className="w-5 h-5 rounded-full bg-accent text-accent-contrast font-bold flex items-center justify-center text-[10px] shrink-0">
                {details.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-primary truncate leading-tight">
                  {details.author_name}
                </span>
                <span className="text-tertiary text-[10px] truncate leading-tight">
                  {new Date(details.author_timestamp_sec * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Files List Header */}
          <div className="px-3 py-2 border-b border-border-subtle bg-window flex items-center justify-between text-[11px] font-bold text-secondary uppercase tracking-wider">
            <span>CÁC TỆP THAY ĐỔI ({details.files.length})</span>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {details.files.map((file) => {
              const isSelected = selectedFilePath === file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFile(file.path)}
                  className={clsx(
                    "flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors text-left w-full border",
                    isSelected
                      ? "bg-accent-subtle border-accent text-accent font-semibold shadow-2xs"
                      : "bg-surface border-border-subtle hover:bg-surface-hover text-primary font-normal"
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText size={12} className={clsx("shrink-0", isSelected ? "text-accent" : "text-secondary")} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] shrink-0 ml-1">
                    <span className="text-diff-add-text font-semibold">{`+${file.additions}`}</span>
                    <span className="text-diff-remove-text font-semibold">{`-${file.deletions}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Diff Viewer */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden">
          {selectedFilePath && currentRepo ? (
            <div className="flex-1 overflow-y-auto p-2">
              <FileDiffViewer
                repoPath={currentRepo.path}
                commitId={selectedCommitId}
                filePath={selectedFilePath}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-tertiary text-xs">
              Chọn một tệp từ danh sách bên trái để xem diff
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
