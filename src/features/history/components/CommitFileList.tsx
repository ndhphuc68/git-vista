import clsx from "clsx";
import { FileText, History, Search, X } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useInspectorStore } from "../../../store/useInspectorStore";
import type { CommitFile } from "../api/useCommitDetails";
import { getFileStatusMeta, splitFilePath } from "../model/commitDetails";

interface CommitFileListProps {
  files: CommitFile[];
  filteredFiles: CommitFile[];
  fileFilter: string;
  setFileFilter: (filter: string) => void;
  selectedFilePath: string | null;
  setSelectedFile: (path: string) => void;
  selectedCommitId: string;
}

export function CommitFileList({
  files,
  filteredFiles,
  fileFilter,
  setFileFilter,
  selectedFilePath,
  setSelectedFile,
  selectedCommitId,
}: CommitFileListProps) {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();
  return (
    <>
      {/* Files List Header with Search Filter */}
      <div className="p-2 border-b border-border-subtle bg-window flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-secondary tracking-wide uppercase px-1">
          <span>{t.diff.filesChangedHeader}</span>
          <span className="text-tertiary font-mono text-[10px] font-normal lowercase">
            {fileFilter
              ? t.diff.filesCountFiltered
                  .replace("{filtered}", String(filteredFiles.length))
                  .replace("{total}", String(files.length))
              : t.diff.filesCount.replace("{count}", String(files.length))}
          </span>
        </div>

        {/* Search input */}
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-tertiary pointer-events-none" />
          <input
            type="text"
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            placeholder={t.diff.searchFilesPlaceholder}
            className="w-full pl-7 pr-7 py-1 text-xs rounded-md bg-surface border border-border-subtle text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          {fileFilter && (
            <button
              type="button"
              onClick={() => setFileFilter("")}
              className="absolute right-2 text-tertiary hover:text-primary cursor-pointer"
              title={t.diff.clearFilterTitle}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {filteredFiles.length === 0 ? (
          <div className="py-6 text-center text-xs text-tertiary">{t.diff.noMatchingFiles}</div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFilePath === file.path;
            const statusMeta = getFileStatusMeta(file.status, t.diff.fileStatus);
            const { dir, fileName } = splitFilePath(file.path);

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file.path)}
                title={file.path}
                className={clsx(
                  "group flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-all text-left w-full border relative",
                  isSelected
                    ? "bg-accent-subtle/80 border-accent/80 text-primary font-semibold shadow-2xs ring-1 ring-accent/30"
                    : "bg-surface border-border-subtle hover:bg-surface-hover text-primary font-normal"
                )}
              >
                {/* Left Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r" />
                )}

                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  {/* Status Badge */}
                  <span
                    className={clsx(
                      "w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 border uppercase font-mono",
                      statusMeta.badgeClass
                    )}
                    title={statusMeta.label}
                  >
                    {statusMeta.code}
                  </span>

                  {/* File Name & Path Details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-primary truncate leading-tight">
                      {fileName}
                    </span>
                    {dir && (
                      <span className="text-[10px] text-tertiary truncate leading-tight font-mono">
                        {dir}
                      </span>
                    )}
                  </div>
                </div>

                {/* Additions / Deletions Stats & Quick Inspector Buttons */}
                <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                  <div className="items-center gap-0.5 hidden group-hover:flex">
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(file.path, "blame", selectedCommitId);
                      }}
                      className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-accent transition-colors cursor-pointer"
                      title={t.inspector.viewBlame}
                    >
                      <FileText size={11} />
                    </span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(file.path, "history");
                      }}
                      className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-accent transition-colors cursor-pointer"
                      title={t.inspector.viewHistory}
                    >
                      <History size={11} />
                    </span>
                  </div>

                  <span className="text-diff-add-text font-semibold">{`+${file.additions}`}</span>
                  <span className="text-diff-remove-text font-semibold">
                    {`-${file.deletions}`}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
