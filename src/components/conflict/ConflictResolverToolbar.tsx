import React from "react";
import { Check } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import { ConflictResolverFileInfo } from "./ConflictResolverFileInfo";
import { ConflictResolverNavActions } from "./ConflictResolverNavActions";

export interface ConflictResolverToolbarProps {
  t: Translations;
  filePath: string;
  totalConflicts: number;
  resolvedCount: number;
  currentConflictIndex: number;
  isSaving: boolean;
  onBack: () => void;
  onPrevConflict: () => void;
  onNextConflict: () => void;
  onTakeAllOurs: () => void;
  onTakeAllTheirs: () => void;
  onSave: () => void;
}

export const ConflictResolverToolbar: React.FC<ConflictResolverToolbarProps> = ({
  t,
  filePath,
  totalConflicts,
  resolvedCount,
  currentConflictIndex,
  isSaving,
  onBack,
  onPrevConflict,
  onNextConflict,
  onTakeAllOurs,
  onTakeAllTheirs,
  onSave,
}) => {
  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface z-10 gap-3">
      <ConflictResolverFileInfo
        t={t}
        filePath={filePath}
        totalConflicts={totalConflicts}
        resolvedCount={resolvedCount}
        onBack={onBack}
      />

      <ConflictResolverNavActions
        t={t}
        totalConflicts={totalConflicts}
        currentConflictIndex={currentConflictIndex}
        onPrevConflict={onPrevConflict}
        onNextConflict={onNextConflict}
        onTakeAllOurs={onTakeAllOurs}
        onTakeAllTheirs={onTakeAllTheirs}
      />

      {/* Right: Save & Stage */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-accent text-white hover:bg-accent-hover active:opacity-90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <Check size={14} />
          <span>{isSaving ? t.conflictResolver.saving : t.conflictResolver.complete}</span>
        </button>
      </div>
    </header>
  );
};
