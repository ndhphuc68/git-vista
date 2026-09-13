import React, { useState } from "react";
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
        color: "var(--accent)",
        bg: "var(--accent-subtle)",
        title: "Modified / Đã sửa",
      };
    case "New":
    case "Untracked":
      return {
        label: "U",
        color: "var(--diff-add-text)",
        bg: "var(--diff-add-bg)",
        title: "Untracked / Tệp mới",
      };
    case "Deleted":
      return {
        label: "D",
        color: "var(--diff-remove-text)",
        bg: "var(--diff-remove-bg)",
        title: "Deleted / Đã xoá",
      };
    case "Renamed":
      return {
        label: "R",
        color: "var(--accent)",
        bg: "var(--accent-subtle)",
        title: "Renamed / Đổi tên",
      };
    default:
      return {
        label: "M",
        color: "var(--text-secondary)",
        bg: "var(--bg-window)",
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        overflowY: "auto",
      }}
    >
      {/* STAGED SECTION */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "var(--bg-window)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={13} color="var(--diff-add-text)" />
            <span>STAGED ({stagedFiles.length})</span>
          </div>
          {stagedFiles.length > 0 && (
            <button
              type="button"
              data-testid="unstage-all-button"
              onClick={onUnstageAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                cursor: "pointer",
              }}
              title="Bỏ đánh dấu tất cả"
            >
              <Minus size={11} />
              <span>Bỏ tất cả</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {stagedFiles.length === 0 ? (
            <div
              style={{
                padding: "12px",
                color: "var(--text-tertiary)",
                fontSize: "var(--font-size-xs)",
                fontStyle: "italic",
              }}
            >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                    transition: "background var(--duration-fast) var(--ease-macos)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        flexShrink: 0,
                      }}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: isSelected ? "var(--accent)" : "var(--text-primary)",
                        fontWeight: isSelected ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      data-testid={`unstage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstageFile(file.path);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        background: "transparent",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "var(--bg-window)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={13} color="var(--accent)" />
            <span>CHANGES ({changesFiles.length})</span>
          </div>
          {changesFiles.length > 0 && (
            <button
              type="button"
              data-testid="stage-all-button"
              onClick={onStageAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                cursor: "pointer",
              }}
              title="Đánh dấu tất cả"
            >
              <Plus size={11} />
              <span>Đánh dấu tất cả</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {changesFiles.length === 0 ? (
            <div
              style={{
                padding: "12px",
                color: "var(--text-tertiary)",
                fontSize: "var(--font-size-xs)",
                fontStyle: "italic",
              }}
            >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                    transition: "background var(--duration-fast) var(--ease-macos)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        flexShrink: 0,
                      }}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: isSelected ? "var(--accent)" : "var(--text-primary)",
                        fontWeight: isSelected ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={file.path}
                    >
                      {file.path}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      data-testid={`stage-file-${file.path}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(file.path);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        background: "transparent",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        background: "transparent",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--diff-remove-text)",
                        cursor: "pointer",
                      }}
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
