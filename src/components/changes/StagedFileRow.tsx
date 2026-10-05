import React from "react";
import clsx from "clsx";
import { Minus, FileText, History } from "lucide-react";
import { type StatusFileItem } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { useInspectorStore } from "../../store/useInspectorStore";
import { getStatusBadge, type SelectedWorkingFile } from "./stagingFileListHelpers";

export interface StagedFileRowProps {
  file: StatusFileItem;
  isSelected: boolean;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onUnstageFile: (filePath: string) => void;
}

/** One row of the STAGED section: badge, path, and blame/history/unstage actions. */
export const StagedFileRow: React.FC<StagedFileRowProps> = ({
  file,
  isSelected,
  onSelectFile,
  onUnstageFile,
}) => {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();
  const badge = getStatusBadge(file.status, t.changes.statusBadge);

  return (
    <div
      onClick={() => onSelectFile({ path: file.path, is_staged: true })}
      className={clsx(
        "flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors duration-fast ease-macos",
        isSelected
          ? "bg-accent-subtle border-l-2 border-accent"
          : "bg-transparent border-l-2 border-transparent hover:bg-surface-hover"
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
            isSelected ? "text-link font-semibold" : "text-primary font-normal"
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
          className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-link transition-colors duration-fast ease-macos"
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
          className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-link transition-colors duration-fast ease-macos"
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
};
