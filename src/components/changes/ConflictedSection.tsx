import React from "react";
import { AlertCircle } from "lucide-react";
import { type StatusFileItem } from "../../ipc/bindings.generated";
import { useTranslation } from "../../i18n";
import { ConflictedFileRow } from "./ConflictedFileRow";

export interface ConflictedSectionProps {
  conflictedFiles: StatusFileItem[];
  onOpenConflictResolver?: (filePath: string) => void;
}

/** The CONFLICTED section, only rendered when there are conflicted files. */
export const ConflictedSection: React.FC<ConflictedSectionProps> = ({
  conflictedFiles,
  onOpenConflictResolver,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-border-subtle flex flex-col bg-diff-remove-bg/30 text-diff-remove-text border-diff-remove-text/30">
      <div className="flex items-center justify-between px-3 py-2 bg-diff-remove-bg/40 text-xs font-semibold tracking-[0.5px]">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={13} className="text-diff-remove-text" />
          <span>
            {t.changes.conflictedTitle} ({conflictedFiles.length})
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {conflictedFiles.map((file) => (
          <ConflictedFileRow
            key={`conflicted-${file.path}`}
            file={file}
            onOpenConflictResolver={onOpenConflictResolver}
          />
        ))}
      </div>
    </div>
  );
};
