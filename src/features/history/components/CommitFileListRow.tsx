import clsx from "clsx";
import { FileText, History } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useInspectorStore } from "../../../store/useInspectorStore";
import type { CommitFile } from "../api/useCommitDetails";
import { getFileStatusMeta, splitFilePath } from "../model/commitDetails";

interface CommitFileListRowProps {
  file: CommitFile;
  isSelected: boolean;
  setSelectedFile: (path: string) => void;
  selectedCommitId: string;
}

/** One file row in the commit's file list, with status badge and quick inspector actions. */
export function CommitFileListRow({
  file,
  isSelected,
  setSelectedFile,
  selectedCommitId,
}: CommitFileListRowProps) {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();
  const statusMeta = getFileStatusMeta(file.status, t.diff.fileStatus);
  const { dir, fileName } = splitFilePath(file.path);

  return (
    <button
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
      {isSelected && <div className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r" />}

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
          <span className="font-semibold text-primary truncate leading-tight">{fileName}</span>
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
        <span className="text-diff-remove-text font-semibold">{`-${file.deletions}`}</span>
      </div>
    </button>
  );
}
