import React from "react";
import { ArrowLeft } from "lucide-react";
import type { Translations } from "../../i18n/vi";

export interface ConflictResolverFileInfoProps {
  t: Translations;
  filePath: string;
  totalConflicts: number;
  resolvedCount: number;
  onBack: () => void;
}

export const ConflictResolverFileInfo: React.FC<ConflictResolverFileInfoProps> = ({
  t,
  filePath,
  totalConflicts,
  resolvedCount,
  onBack,
}) => {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded-sm border border-border-subtle transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>{t.conflictResolver.back}</span>
      </button>
      <div className="flex items-center gap-2 truncate">
        <span className="font-semibold text-xs text-primary truncate" title={filePath}>
          {filePath}
        </span>
        <span
          className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
            resolvedCount === totalConflicts
              ? "bg-diff-add-bg text-diff-add-text"
              : "bg-diff-remove-bg text-diff-remove-text"
          }`}
        >
          {t.conflictResolver.progress
            .replace("{resolved}", String(resolvedCount))
            .replace("{total}", String(totalConflicts))}
        </span>
      </div>
    </div>
  );
};
