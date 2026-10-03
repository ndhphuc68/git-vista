import React from "react";
import { Play, PlayCircle, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface StashActionBarProps {
  stashIndex: number;
  onApply: (index: number) => void;
  onPop: (index: number) => void;
  onDrop: (index: number) => void;
}

/**
 * Apply / pop / drop action buttons for a single stash entry. Extracted from
 * `StashDiffView`, keeping the same markup and handlers verbatim.
 */
export const StashActionBar: React.FC<StashActionBarProps> = ({
  stashIndex,
  onApply,
  onPop,
  onDrop,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-surface shrink-0">
      <Button
        variant="secondary"
        onClick={() => onApply(stashIndex)}
        title={t.modals.stashDiff.applyTitle}
      >
        <Play size={12} className="text-accent" />
        <span>{t.modals.stashDiff.applyBtn}</span>
      </Button>
      <Button
        variant="secondary"
        onClick={() => onPop(stashIndex)}
        title={t.modals.stashDiff.popTitle}
      >
        <PlayCircle size={12} className="text-accent" />
        <span>{t.modals.stashDiff.popBtn}</span>
      </Button>
      <Button
        variant="danger"
        onClick={() => onDrop(stashIndex)}
        title={t.modals.stashDiff.dropTitle}
      >
        <Trash2 size={12} />
        <span>{t.modals.stashDiff.dropBtn}</span>
      </Button>
    </div>
  );
};
