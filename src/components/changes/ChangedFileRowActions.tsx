import React from "react";
import { Plus, Trash2, FileText, History } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useInspectorStore } from "../../store/useInspectorStore";

export interface ChangedFileRowActionsProps {
  filePath: string;
  isUntracked: boolean | undefined;
  onStageFile: (filePath: string) => void;
  onSetDiscardTarget: (filePath: string) => void;
}

/** The blame/history/stage/discard action buttons of a CHANGES section row. */
export const ChangedFileRowActions: React.FC<ChangedFileRowActionsProps> = ({
  filePath,
  isUntracked,
  onStageFile,
  onSetDiscardTarget,
}) => {
  const { t } = useTranslation();
  const { openInspector } = useInspectorStore();

  return (
    <div className="flex items-center gap-1">
      {!isUntracked && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openInspector(filePath, "blame");
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
              openInspector(filePath, "history");
            }}
            className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-link transition-colors duration-fast ease-macos"
            title={t.inspector.viewHistory}
          >
            <History size={12} />
          </button>
        </>
      )}

      <button
        type="button"
        data-testid={`stage-file-${filePath}`}
        onClick={(e) => {
          e.stopPropagation();
          onStageFile(filePath);
        }}
        className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-secondary cursor-pointer hover:bg-surface-hover hover:text-primary transition-colors duration-fast ease-macos"
        title={t.changes.stageTitle}
      >
        <Plus size={12} />
      </button>

      <button
        type="button"
        data-testid={`discard-file-${filePath}`}
        onClick={(e) => {
          e.stopPropagation();
          onSetDiscardTarget(filePath);
        }}
        className="flex items-center justify-center w-[22px] h-[22px] bg-transparent border border-border-subtle rounded-sm text-diff-remove-text cursor-pointer hover:bg-diff-remove-bg transition-colors duration-fast ease-macos"
        title={t.discard.title}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};
