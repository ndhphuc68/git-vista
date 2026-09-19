/**
 * The collapsible STASHES section of the branch sidebar: the header and one
 * row per stash entry with its apply / pop / drop buttons.
 *
 * Presentational — every action is a callback so the sidebar keeps owning the
 * IPC calls, the undo toast and the selected-stash panel.
 */
import React from "react";
import clsx from "clsx";
import { Archive, ChevronDown, ChevronRight, Play, PlayCircle, Trash2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type StashItem } from "../../../ipc/bindings.generated";

export interface StashSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  stashes: StashItem[];
  selectedStash: StashItem | null;
  onSelectStash: (stash: StashItem | null) => void;
  onApply: (index: number) => void;
  onPop: (index: number) => void;
  onDrop: (index: number) => void;
}

export const StashSection: React.FC<StashSectionProps> = ({
  isOpen,
  onToggle,
  stashes,
  selectedStash,
  onSelectStash,
  onApply,
  onPop,
  onDrop,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <button
        onClick={() => onToggle()}
        aria-expanded={isOpen}
        aria-label={t.sidebar.stashes}
        className="flex items-center gap-1.5 w-full p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
      >
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Archive size={13} />
        <span>
          {t.sidebar.stashes} ({stashes.length})
        </span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-0.5 mt-1">
          {stashes.length === 0 ? (
            <div className="px-2 py-1 text-xs text-tertiary italic">{t.sidebar.emptyStashes}</div>
          ) : (
            stashes.map((item) => (
              <div
                key={item.index}
                className={clsx(
                  "group flex items-center justify-between rounded-sm px-2 py-1 cursor-pointer text-xs transition-colors",
                  selectedStash?.index === item.index
                    ? "bg-accent-subtle text-accent font-semibold"
                    : "bg-transparent text-primary hover:bg-surface-hover"
                )}
                onClick={() => onSelectStash(item)}
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
            ))
          )}
        </div>
      )}
    </div>
  );
};
