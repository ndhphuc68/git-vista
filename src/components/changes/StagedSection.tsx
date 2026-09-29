import React from "react";
import { CheckCircle2, Minus } from "lucide-react";
import { type StatusFileItem } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { StagedFileRow } from "./StagedFileRow";
import { type SelectedWorkingFile } from "./stagingFileListHelpers";

export interface StagedSectionProps {
  stagedFiles: StatusFileItem[];
  selectedFile: SelectedWorkingFile | null;
  onSelectFile: (file: SelectedWorkingFile) => void;
  onUnstageFile: (filePath: string) => void;
  onUnstageAll: () => void;
}

/** The STAGED section: title/count header, unstage-all button, and the staged rows. */
export const StagedSection: React.FC<StagedSectionProps> = ({
  stagedFiles,
  selectedFile,
  onSelectFile,
  onUnstageFile,
  onUnstageAll,
}) => {
  const { t } = useTranslation();

  return (
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
          stagedFiles.map((file) => (
            <StagedFileRow
              key={`staged-${file.path}`}
              file={file}
              isSelected={selectedFile?.path === file.path && selectedFile?.is_staged === true}
              onSelectFile={onSelectFile}
              onUnstageFile={onUnstageFile}
            />
          ))
        )}
      </div>
    </div>
  );
};
