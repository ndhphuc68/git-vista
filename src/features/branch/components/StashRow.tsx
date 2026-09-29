/**
 * One row of the STASHES section: the stash summary plus its apply / pop /
 * drop buttons, revealed on hover.
 */
import React from "react";
import clsx from "clsx";
import { Play, PlayCircle, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type StashItem } from "../../../ipc/bindings.generated";

export interface StashRowProps {
  item: StashItem;
  isSelected: boolean;
  onSelect: (stash: StashItem) => void;
  onApply: (index: number) => void;
  onPop: (index: number) => void;
  onDrop: (index: number) => void;
}

export const StashRow: React.FC<StashRowProps> = ({
  item,
  isSelected,
  onSelect,
  onApply,
  onPop,
  onDrop,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        "group flex items-center justify-between rounded-sm px-2 py-1 cursor-pointer text-xs transition-colors",
        isSelected
          ? "bg-accent-subtle text-accent font-semibold"
          : "bg-transparent text-primary hover:bg-surface-hover"
      )}
      onClick={() => onSelect(item)}
    >
      <span className="truncate">
        stash@{"{"}
        {item.index}
        {"}"}: {item.message.substring(0, 40)}
      </span>
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title={t.sidebar.applyStashTitle}
          onClick={() => onApply(item.index)}
          className="p-0.5 bg-transparent border-0 text-secondary hover:text-accent cursor-pointer rounded-sm"
        >
          <Play size={11} />
        </button>
        <button
          type="button"
          title={t.sidebar.popStashTitle}
          onClick={() => onPop(item.index)}
          className="p-0.5 bg-transparent border-0 text-secondary hover:text-accent cursor-pointer rounded-sm"
        >
          <PlayCircle size={11} />
        </button>
        <button
          type="button"
          title={t.sidebar.dropStashTitle}
          onClick={() => onDrop(item.index)}
          className="p-0.5 bg-transparent border-0 text-secondary hover:text-diff-remove-text cursor-pointer rounded-sm"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};
