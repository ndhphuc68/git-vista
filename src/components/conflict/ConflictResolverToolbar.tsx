import React from "react";
import { Check } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import { Button } from "../../shared/ui";
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
        <Button onClick={onSave} disabled={isSaving}>
          <Check size={14} />
          <span>{isSaving ? t.conflictResolver.saving : t.conflictResolver.complete}</span>
        </Button>
      </div>
    </header>
  );
};
