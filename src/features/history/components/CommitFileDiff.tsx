import clsx from "clsx";
import { Check, Copy, ChevronLeft, ChevronRight, FileText, Folder, History } from "lucide-react";
import { FileDiffViewer } from "../../../components/diff/FileDiffViewer";
import { useTranslation } from "../../../i18n";
import { useInspectorStore } from "../../../store/useInspectorStore";
import type { CommitFile } from "../api/useCommitDetails";
import { getFileStatusMeta, splitFilePath } from "../model/commitDetails";

interface CommitFileDiffProps {
  repoPath: string | undefined;
  selectedCommitId: string;
  selectedFile: CommitFile | null;
  fileCount: number;
  currentFileIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  handlePrevFile: () => void;
  handleNextFile: () => void;
  copiedFilePath: boolean;
  handleCopyFilePath: (path: string) => void;
}

export function CommitFileDiff({
  repoPath,
  selectedCommitId,
  selectedFile,
  fileCount,
  currentFileIndex,
  hasPrev,
  hasNext,
  handlePrevFile,
  handleNextFile,
  copiedFilePath,
  handleCopyFilePath,
}: CommitFileDiffProps) {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();
  const selectedFileMeta = selectedFile
    ? getFileStatusMeta(selectedFile.status, t.diff.fileStatus)
    : null;
  const selectedPathParts = selectedFile ? splitFilePath(selectedFile.path) : null;
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
      {selectedFile && repoPath !== undefined ? (
        <>
          {/* Sticky File Header */}
          <div className="h-11 px-4 border-b border-border-subtle bg-window flex items-center justify-between shrink-0 shadow-2xs">
            {/* Left: Status badge, directory breadcrumb, file name, copy button */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
              {selectedFileMeta && (
                <span
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border shrink-0 uppercase font-mono",
                    selectedFileMeta.badgeClass
                  )}
                >
                  <span>{selectedFileMeta.code}</span>
                  <span className="font-sans font-normal hidden sm:inline text-[10px]">
                    {selectedFileMeta.label}
                  </span>
                </span>
              )}

              <div className="flex items-center text-xs font-mono min-w-0 truncate">
                <span className="text-tertiary mr-1.5 hidden md:inline font-sans text-[11px]">
                  {t.diff.fileLabel}
                </span>
                <span className="font-bold text-primary truncate">
                  {selectedPathParts?.dir
                    ? `${selectedPathParts.dir}${selectedPathParts.fileName}`
                    : `/${selectedFile.path}`}
                </span>
              </div>

              {/* Copy file path button */}
              <button
                type="button"
                onClick={() => handleCopyFilePath(selectedFile.path)}
                className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-primary transition-colors cursor-pointer shrink-0"
                title={t.diff.copyPathTooltip}
              >
                {copiedFilePath ? (
                  <Check size={13} className="text-diff-add-text" />
                ) : (
                  <Copy size={13} />
                )}
              </button>

              <button
                type="button"
                onClick={() => openInspector(selectedFile.path, "blame", selectedCommitId)}
                className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-primary transition-colors cursor-pointer shrink-0"
                title={t.inspector.viewBlame}
              >
                <FileText size={13} />
              </button>

              <button
                type="button"
                onClick={() => openInspector(selectedFile.path, "history")}
                className="p-1 rounded hover:bg-surface-hover text-tertiary hover:text-primary transition-colors cursor-pointer shrink-0"
                title={t.inspector.viewHistory}
              >
                <History size={13} />
              </button>

              <div className="flex items-center gap-1 font-mono text-xs shrink-0 ml-1">
                <span className="text-diff-add-text font-semibold">{`+${selectedFile.additions}`}</span>
                <span className="text-diff-remove-text font-semibold">{`-${selectedFile.deletions}`}</span>
              </div>
            </div>

            {/* Right: Prev / Next File Navigation */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-tertiary font-mono mr-1.5">
                {currentFileIndex >= 0 ? `${currentFileIndex + 1} / ${fileCount}` : ""}
              </span>

              <button
                type="button"
                onClick={handlePrevFile}
                disabled={!hasPrev}
                className="p-1 rounded border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none text-secondary hover:text-primary transition-colors cursor-pointer"
                title={t.diff.prevFile}
              >
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={handleNextFile}
                disabled={!hasNext}
                className="p-1 rounded border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none text-secondary hover:text-primary transition-colors cursor-pointer"
                title={t.diff.nextFile}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Code Diff Viewer Area */}
          <div className="flex-1 overflow-y-auto p-3">
            <FileDiffViewer
              repoPath={repoPath}
              commitId={selectedCommitId}
              filePath={selectedFile.path}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-tertiary text-xs gap-2">
          <Folder size={24} className="opacity-40" />
          <span>{t.diff.selectFilePrompt}</span>
        </div>
      )}
    </div>
  );
}
