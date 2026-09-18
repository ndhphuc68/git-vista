import React, { useMemo } from "react";
import clsx from "clsx";
import { Search, File } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CompareFileItem } from "../../ipc/bindings";

export interface CompareFileListProps {
  files: CompareFileItem[];
  selectedFile: CompareFileItem | null;
  onSelectFile: (file: CompareFileItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export const CompareFileList: React.FC<CompareFileListProps> = ({
  files,
  selectedFile,
  onSelectFile,
  searchQuery,
  onSearchChange,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        (f.old_path && f.old_path.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "added" || s === "new") {
      return (
        <span
          className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold bg-diff-add-bg text-diff-add-text border border-diff-add-border"
          title="Added"
        >
          A
        </span>
      );
    }
    if (s === "deleted") {
      return (
        <span
          className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border"
          title="Deleted"
        >
          D
        </span>
      );
    }
    if (s === "renamed") {
      return (
        <span
          className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30"
          title="Renamed"
        >
          R
        </span>
      );
    }
    return (
      <span
        className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
        title="Modified"
      >
        M
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search filter input */}
      <div className="p-2 border-b border-border-subtle bg-surface/50 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.compare.searchFiles}
            className="w-full pl-7 pr-3 py-1 text-xs rounded bg-window border border-border-subtle text-primary placeholder:text-tertiary focus:outline-hidden focus:border-accent"
          />
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-secondary text-xs gap-2 h-48">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Đang tải danh sách tập tin...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-tertiary text-xs gap-2 h-48 text-center">
            <File size={24} className="opacity-40" />
            <span>{t.compare.noFiles}</span>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => onSelectFile(file)}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2 text-left text-xs gap-2 cursor-pointer transition-colors border-l-2",
                  isSelected
                    ? "bg-accent/15 border-accent text-primary font-medium"
                    : "border-transparent text-secondary hover:bg-surface-hover hover:text-primary"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {renderStatusBadge(file.status)}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="font-mono text-xs truncate"
                      title={file.path}
                    >
                      {file.path}
                    </span>
                    {file.old_path && (
                      <span className="font-mono text-[10px] text-tertiary truncate">
                        ← {file.old_path}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stat numbers */}
                <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                  {file.additions > 0 && (
                    <span className="text-diff-add-text">+{file.additions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className="text-diff-remove-text">-{file.deletions}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
