import React from "react";
import { AlertCircle } from "lucide-react";
import { type StatusFileItem } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";

export interface ConflictedFileRowProps {
  file: StatusFileItem;
  onOpenConflictResolver?: (filePath: string) => void;
}

/** One row of the CONFLICTED section: path and a resolve action. */
export const ConflictedFileRow: React.FC<ConflictedFileRowProps> = ({
  file,
  onOpenConflictResolver,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 py-1.5 transition-colors duration-fast ease-macos hover:bg-diff-remove-bg/40">
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
        <AlertCircle size={13} className="shrink-0 text-diff-remove-text" />
        <span
          className="text-xs overflow-hidden text-ellipsis font-medium text-diff-remove-text"
          title={file.path}
        >
          {file.path}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid={`resolve-conflict-${file.path}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenConflictResolver?.(file.path);
          }}
          className="flex items-center gap-1 px-2 py-0.5 bg-diff-remove-text text-white rounded-sm text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          {t.changes.resolveBtn}
        </button>
      </div>
    </div>
  );
};
