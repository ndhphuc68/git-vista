import clsx from "clsx";
import { Check, Copy, FileText, History } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useInspectorStore } from "../../../store/useInspectorStore";
import type { CommitFile } from "../api/useCommitDetails";
import { getFileStatusMeta, splitFilePath } from "../model/commitDetails";

interface CommitFileDiffHeaderInfoProps {
  selectedFile: CommitFile;
  selectedCommitId: string;
  copiedFilePath: boolean;
  handleCopyFilePath: (path: string) => void;
}

/** Left side of the file diff header: status badge, path, copy/blame/history actions. */
export function CommitFileDiffHeaderInfo({
  selectedFile,
  selectedCommitId,
  copiedFilePath,
  handleCopyFilePath,
}: CommitFileDiffHeaderInfoProps) {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();
  const selectedFileMeta = getFileStatusMeta(selectedFile.status, t.diff.fileStatus);
  const selectedPathParts = splitFilePath(selectedFile.path);

  return (
    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
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

      <div className="flex items-center text-xs font-mono min-w-0 truncate">
        <span className="text-tertiary mr-1.5 hidden md:inline font-sans text-[11px]">
          {t.diff.fileLabel}
        </span>
        <span className="font-bold text-primary truncate">
          {selectedPathParts.dir
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
        {copiedFilePath ? <Check size={13} className="text-diff-add-text" /> : <Copy size={13} />}
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
  );
}
