/**
 * The collapsible STASHES section of the branch sidebar: the header and one
 * row per stash entry with its apply / pop / drop buttons.
 *
 * Presentational — every action is a callback so the sidebar keeps owning the
 * IPC calls, the undo toast and the selected-stash panel.
 */
import React from "react";
import { Archive, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { type StashItem } from "../../../ipc/bindings.generated";
import { StashRow } from "./StashRow";

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
              <StashRow
                key={item.index}
                item={item}
                isSelected={selectedStash?.index === item.index}
                onSelect={onSelectStash}
                onApply={onApply}
                onPop={onPop}
                onDrop={onDrop}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
