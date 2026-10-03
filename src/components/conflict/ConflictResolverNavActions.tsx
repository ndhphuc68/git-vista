import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Translations } from "../../i18n/vi";
import { Button } from "../../shared/ui";

export interface ConflictResolverNavActionsProps {
  t: Translations;
  totalConflicts: number;
  currentConflictIndex: number;
  onPrevConflict: () => void;
  onNextConflict: () => void;
  onTakeAllOurs: () => void;
  onTakeAllTheirs: () => void;
}

export const ConflictResolverNavActions: React.FC<ConflictResolverNavActionsProps> = ({
  t,
  totalConflicts,
  currentConflictIndex,
  onPrevConflict,
  onNextConflict,
  onTakeAllOurs,
  onTakeAllTheirs,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-border-subtle rounded-sm overflow-hidden bg-surface">
        <button
          type="button"
          onClick={onPrevConflict}
          disabled={currentConflictIndex <= 0}
          className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={t.conflictResolver.prevConflict}
        >
          <ChevronUp size={13} />
          <span>{t.conflictResolver.prevConflict}</span>
        </button>
        <div className="w-[1px] h-4 bg-border-subtle" />
        <button
          type="button"
          onClick={onNextConflict}
          disabled={currentConflictIndex >= totalConflicts - 1}
          className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={t.conflictResolver.nextConflict}
        >
          <span>{t.conflictResolver.nextConflict}</span>
          <ChevronDown size={13} />
        </button>
      </div>

      <Button
        variant="secondary"
        aria-label={t.conflictResolver.takeAllOursAria}
        onClick={onTakeAllOurs}
      >
        {t.conflictResolver.takeAllOurs}
      </Button>

      <Button
        variant="secondary"
        aria-label={t.conflictResolver.takeAllTheirsAria}
        onClick={onTakeAllTheirs}
      >
        {t.conflictResolver.takeAllTheirs}
      </Button>
    </div>
  );
};
