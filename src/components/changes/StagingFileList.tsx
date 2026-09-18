import React, { useState } from "react";
import clsx from "clsx";
import { Plus, Minus, Trash2, CheckCircle2, AlertCircle, FileText, History } from "lucide-react";
import { type RepoStatusResult, type StatusFileItem, type FileStatus } from "../../ipc/bindings";
import { DiscardConfirmModal } from "./DiscardConfirmModal";
import { useTranslation } from "../../i18n";
import { useInspectorStore } from "../../store/useInspectorStore";

export interface SelectedWorkingFile {
  path: string;
  is_staged: boolean;
}

export interface StagingFileListProps {
  repoPath?: string;
  status?: RepoStatusResult;
  staged?: StatusFileItem[];
  unstaged?: StatusFileItem[];
  untracked?: StatusFileItem[];
  conflicted?: StatusFileItem[];
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onUnstageFile: (filePath: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onDiscardFile: (filePath: string) => void;
  onOpenConflictResolver?: (filePath: string) => void;
}

const getStatusBadge = (
  status: FileStatus | "Untracked",
  badgeDict: Record<"conflicted" | "modified" | "untracked" | "deleted" | "renamed", string>
) => {
  switch (status) {
    case "Conflicted":
      return {
        label: "C",
        className: "bg-diff-remove-bg text-diff-remove-text",
        title: badgeDict.conflicted,
      };
    case "Modified":
      return {
        label: "M",
        className: "bg-accent-subtle text-accent",
        title: badgeDict.modified,
      };
    case "New":
    case "Untracked":
      return {
        label: "U",
        className: "bg-diff-add-bg text-diff-add-text",
        title: badgeDict.untracked,
      };
    case "Deleted":
      return {
        label: "D",
        className: "bg-diff-remove-bg text-diff-remove-text",
        title: badgeDict.deleted,
      };
    case "Renamed":
      return {
        label: "R",
        className: "bg-accent-subtle text-accent",
        title: badgeDict.renamed,
      };
    default:
      return {
        label: "M",
        className: "bg-window text-secondary",
        title: String(status),
      };
  }
};

export const StagingFileList: React.FC<StagingFileListProps> = ({
  status,
  staged,
  unstaged,
  untracked,
  conflicted,
  selectedFile,
  onSelectFile,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onDiscardFile,
  onOpenConflictResolver,
}) => {
  const { t } = useTranslation();
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);
  const { openInspector } = useInspectorStore();

  const stagedFiles = staged ?? status?.staged ?? [];
  const unstagedFiles = unstaged ?? status?.unstaged ?? [];
  const untrackedFiles = untracked ?? status?.untracked ?? [];
  const conflictedFiles = conflicted ?? status?.conflicted ?? [];
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
            <span>
              {t.changes.stagedTitle} ({stagedFiles.length})
            </span>
          </div>
          {stagedFiles.length > 0 && (
            <button
              type="button"
              data-testid="unstage-all-button"
              onClick={onUnstageAll}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-transparent border border-border-subtle rounded-sm text-secondary text-xs cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
              title={t.changes.unstageAll}
            >
              <Minus size={11} />
              <span>{t.changes.unstageAll}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {stagedFiles.length === 0 ? (
            <div className="p-3 text-tertiary text-xs italic">{t.changes.noStagedFiles}</div>
          ) : (
            stagedFiles.map((file) => {
              const isSelected =
                selectedFile?.path === file.path && selectedFile?.is_staged === true;
              const badge = getStatusBadge(file.status, t.changes.statusBadge);

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
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(file.path, "blame");
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-accent transition-colors duration-fast ease-macos"
                      title={t.inspector.viewBlame}
                    >
                      <FileText size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(file.path, "history");
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-accent transition-colors duration-fast ease-macos"
                      title={t.inspector.viewHistory}
                    >
                      <History size={12} />
                    </button>
                    <button
                      type="button"
                      data-testid={`unstage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstageFile(file.path);
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
                      title={t.changes.unstageTitle}
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

      {/* CONFLICTED SECTION */}
      {conflictedFiles.length > 0 && (
        <div className="border-b border-border-subtle flex flex-col bg-diff-remove-bg/30 text-diff-remove-text border-diff-remove-text/30">
          <div className="flex items-center justify-between px-3 py-2 bg-diff-remove-bg/40 text-xs font-semibold tracking-[0.5px]">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-diff-remove-text" />
              <span>
                {t.changes.conflictedTitle} ({conflictedFiles.length})
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            {conflictedFiles.map((file) => {
              return (
                <div
                  key={`conflicted-${file.path}`}
                  className="flex items-center justify-between px-3 py-1.5 transition-colors duration-fast ease-macos hover:bg-diff-remove-bg/40"
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
                    <AlertCircle size={13} className="shrink-0 text-diff-remove-text" />
                    <span
                      className="text-xs overflow-hidden text-ellipsis font-medium text-diff-remove-text"
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`resolve-conflict-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenConflictResolver?.(file.path);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-diff-remove-text text-white rounded-sm text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {t.changes.resolveBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHANGES SECTION */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-3 py-2 bg-window text-xs font-semibold text-secondary tracking-[0.5px]">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-accent" />
            <span>
              {t.changes.changesTitle} ({changesFiles.length})
            </span>
          </div>
          {changesFiles.length > 0 && (
            <button
              type="button"
              data-testid="stage-all-button"
              onClick={onStageAll}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-transparent border border-border-subtle rounded-sm text-secondary text-[11px] cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
              title={t.changes.stageAll}
            >
              <Plus size={11} />
              <span>{t.changes.stageAll}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col">
          {changesFiles.length === 0 ? (
            <div className="p-3 text-tertiary text-xs italic">{t.changes.noChanges}</div>
          ) : (
            changesFiles.map((file) => {
              const isSelected =
                selectedFile?.path === file.path && selectedFile?.is_staged === false;
              const badge = getStatusBadge(
                file.isUntracked ? "Untracked" : file.status,
                t.changes.statusBadge
              );

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
                    {!file.isUntracked && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspector(file.path, "blame");
                          }}
                          className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-accent transition-colors duration-fast ease-macos"
                          title={t.inspector.viewBlame}
                        >
                          <FileText size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspector(file.path, "history");
                          }}
                          className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-accent transition-colors duration-fast ease-macos"
                          title={t.inspector.viewHistory}
                        >
                          <History size={12} />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      data-testid={`stage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(file.path);
                      }}
                      className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
                      title={t.changes.stageTitle}
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
                      title={t.discard.title}
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
