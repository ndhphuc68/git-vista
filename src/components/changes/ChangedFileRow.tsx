import React from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";
import { getStatusBadge, type ChangedFileItem, type SelectedWorkingFile } from "./stagingFileListHelpers";
import { ChangedFileRowActions } from "./ChangedFileRowActions";

export interface ChangedFileRowProps {
  file: ChangedFileItem;
  isSelected: boolean;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onSetDiscardTarget: (filePath: string) => void;
}

/** One row of the CHANGES section: badge, path, and stage/blame/history/discard actions. */
export const ChangedFileRow: React.FC<ChangedFileRowProps> = ({
  file,
  isSelected,
  onSelectFile,
  onStageFile,
  onSetDiscardTarget,
}) => {
  const { t } = useTranslation();
  const badge = getStatusBadge(file.isUntracked ? "Untracked" : file.status, t.changes.statusBadge);

  return (
    <div
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

      <ChangedFileRowActions
        filePath={file.path}
        isUntracked={file.isUntracked}
        onStageFile={onStageFile}
        onSetDiscardTarget={onSetDiscardTarget}
      />
    </div>
  );
};
