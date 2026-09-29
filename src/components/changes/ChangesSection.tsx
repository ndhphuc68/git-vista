import React from "react";
import { AlertCircle, Plus } from "lucide-react";
import { useTranslation } from "../../i18n";
import { ChangedFileRow } from "./ChangedFileRow";
import { type ChangedFileItem, type SelectedWorkingFile } from "./stagingFileListHelpers";

export interface ChangesSectionProps {
  changesFiles: ChangedFileItem[];
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onStageFile: (filePath: string) => void;
  onSetDiscardTarget: (filePath: string) => void;
  onStageAll: () => void;
}

/** The CHANGES section: title/count header, stage-all button, and the changed rows. */
export const ChangesSection: React.FC<ChangesSectionProps> = ({
  changesFiles,
  selectedFile,
  onSelectFile,
  onStageFile,
  onSetDiscardTarget,
  onStageAll,
}) => {
  const { t } = useTranslation();

  return (
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
          changesFiles.map((file) => (
            <ChangedFileRow
              key={`changes-${file.path}`}
              file={file}
              isSelected={selectedFile?.path === file.path && selectedFile?.is_staged === false}
              onSelectFile={onSelectFile}
              onStageFile={onStageFile}
              onSetDiscardTarget={onSetDiscardTarget}
            />
          ))
        )}
      </div>
    </div>
  );
};
