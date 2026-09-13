import React, { useState } from "react";
import clsx from "clsx";
import { Plus, Minus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { RepoStatusResult, StatusFileItem, FileStatus } from "../../ipc/bindings";
import { DiscardConfirmModal } from "./DiscardConfirmModal";

export interface SelectedWorkingFile {
  path: string;
  is_staged: boolean;
}

export interface StagingFileListProps {
  repoPath: string;
  status: RepoStatusResult;
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onUnstageFile: (filePath: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onDiscardFile: (filePath: string) => void;
}

const getStatusBadge = (status: FileStatus | "Untracked") => {
  switch (status) {
    case "Modified":
      return {
        label: "M",
        className: "bg-accent-subtle text-accent",
        title: "Modified / Đã sửa",
      };
    case "New":
    case "Untracked":
      return {
        label: "U",
        className: "bg-diff-add-bg text-diff-add-text",
        title: "Untracked / Tệp mới",
      };
    case "Deleted":
      return {
        label: "D",
        className: "bg-diff-remove-bg text-diff-remove-text",
        title: "Deleted / Đã xoá",
      };
    case "Renamed":
      return {
        label: "R",
        className: "bg-accent-subtle text-accent",
        title: "Renamed / Đổi tên",
      };
    default:
      return {
        label: "M",
        className: "bg-window text-secondary",
        title: status,
      };
  }
};

export const StagingFileList: React.FC<StagingFileListProps> = ({
  status,
  selectedFile,
  onSelectFile,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onDiscardFile,
}) => {
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);

  const stagedFiles = status.staged || [];
  const unstagedFiles = status.unstaged || [];
  const untrackedFiles = status.untracked || [];
  const changesFiles: Array<StatusFileItem & { isUntracked?: boolean }> = [
    ...unstagedFiles,
    ...untrackedFiles.map((u) => ({ ...u, isUntracked: true })),
  ];

  const handleConfirmDiscard = () => {
    if (discardTarget) {
      onDiscardFile(discardTarget);
      setDiscardTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface border-r border-border-subtle overflow-y-auto">
      {/* STAGED SECTION */}
      <div className="border-b border-border-subtle flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-window text-xs font-semibold text-secondary tracking-[0.5px]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-diff-add-text" />
            <span>STAGED ({stagedFiles.length})</span>
          </div>
          {stagedFiles.length > 0 && (
            <button
              type="button"
              data-testid="unstage-all-button"
              onClick={onUnstageAll}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-transparent border border-border-subtle rounded-sm text-secondary text-xs cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
              title="Bỏ đánh dấu tất cả"
            >
              <Minus size={11} />
              <span>Bỏ tất cả</span>
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {stagedFiles.length === 0 ? (
            <div className="p-3 text-tertiary text-xs italic">
              Chưa có file nào được đánh dấu
            </div>
          ) : (
            stagedFiles.map((file) => {
              const isSelected =
                selectedFile?.path === file.path && selectedFile?.is_staged === true;
              const badge = getStatusBadge(file.status);

              return (
                <div
                  key={`staged-${file.path}`}
                  onClick={() => onSelectFile({ path: file.path, is_staged: true })}
                  className={clsx(
                    "flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors duration-fast ease-macos",
                    isSelected
                      ? "bg-accent-subtle border-l-[3px] border-accent"
                      : "bg-transparent border-l-[3px] border-transparent hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
                    <span
                      className={clsx(
                        "inline-flex items-center justify-center w-[18px] h-[18px] rounded-sm text-[10px] font-bold shrink-0",
                        badge.className
                      )}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                    <span
                      className={clsx(
                        "text-xs overflow-hidden text-ellipsis",
                        isSelected ? "text-accent font-semibold" : "text-primary font-normal"
                      )}
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`unstage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstageFile(file.path);
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
                      title="Bỏ đánh dấu (Unstage)"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHANGES SECTION */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-3 py-2 bg-window text-xs font-semibold text-secondary tracking-[0.5px]">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-accent" />
            <span>CHANGES ({changesFiles.length})</span>
          </div>
          {changesFiles.length > 0 && (
            <button
              type="button"
              data-testid="stage-all-button"
              onClick={onStageAll}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-transparent border border-border-subtle rounded-sm text-secondary text-[11px] cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
              title="Đánh dấu tất cả"
            >
              <Plus size={11} />
              <span>Đánh dấu tất cả</span>
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {changesFiles.length === 0 ? (
            <div className="p-3 text-tertiary text-xs italic">
              Không có thay đổi nào trong thư mục làm việc
            </div>
          ) : (
            changesFiles.map((file) => {
              const isSelected =
                selectedFile?.path === file.path && selectedFile?.is_staged === false;
              const badge = getStatusBadge(file.isUntracked ? "Untracked" : file.status);

              return (
                <div
                  key={`changes-${file.path}`}
                  onClick={() => onSelectFile({ path: file.path, is_staged: false })}
                  className={clsx(
                    "flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors duration-fast ease-macos",
                    isSelected
                      ? "bg-accent-subtle border-l-[3px] border-accent"
                      : "bg-transparent border-l-[3px] border-transparent hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
                    <span
                      className={clsx(
                        "inline-flex items-center justify-center w-[18px] h-[18px] rounded-sm text-[10px] font-bold shrink-0",
                        badge.className
                      )}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                    <span
                      className={clsx(
                        "text-xs overflow-hidden text-ellipsis",
                        isSelected ? "text-accent font-semibold" : "text-primary font-normal"
                      )}
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`stage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(file.path);
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
                      title="Đánh dấu (Stage)"
                    >
                      <Plus size={12} />
                    </button>

                    <button
                      type="button"
                      data-testid={`discard-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDiscardTarget(file.path);
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-diff-remove-text cursor-pointer hover:bg-diff-remove-bg transition-colors duration-fast ease-macos"
                      title="Huỷ thay đổi (Discard)"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <DiscardConfirmModal
        isOpen={Boolean(discardTarget)}
        filePath={discardTarget}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setDiscardTarget(null)}
      />
    </div>
  );
};

