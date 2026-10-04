import React from "react";
import clsx from "clsx";
import type { CommandItem } from "../../utils/commandRegistry";
import type { CommandCategoryGroup } from "./commandPaletteHelpers";
import type { UseCommandPaletteResult } from "./useCommandPalette";

export interface CommandPaletteListProps {
  t: UseCommandPaletteResult["t"];
  query: string;
  filteredCommands: CommandItem[];
  categories: CommandCategoryGroup[];
  selectedIndex: number;
  itemRefs: UseCommandPaletteResult["itemRefs"];
  setSelectedIndex: (index: number) => void;
  onExecute: (cmd: CommandItem) => void;
}

export const CommandPaletteList: React.FC<CommandPaletteListProps> = ({
  t,
  query,
  filteredCommands,
  categories,
  selectedIndex,
  itemRefs,
  setSelectedIndex,
  onExecute,
}) => (
  <div className="overflow-y-auto flex-1 p-2 space-y-3">
    {filteredCommands.length === 0 ? (
      <div className="text-center py-8 text-secondary text-sm">
        {t.palette.emptyMatch.replace("{query}", query)}
      </div>
    ) : (
      categories.map((group) => (
        <div key={group.category} className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted select-none">
            {group.label}
          </div>
          {group.items.map(({ command, flatIndex }) => {
            const isSelected = selectedIndex === flatIndex;
            return (
              <button
                key={command.id}
                ref={(el) => {
                  itemRefs.current[flatIndex] = el;
                }}
                type="button"
                onClick={() => onExecute(command)}
                onMouseEnter={() => setSelectedIndex(flatIndex)}
                className={clsx(
                  "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-fast ease-macos",
                  isSelected
                    ? "border border-accent/20 bg-accent-subtle font-medium text-primary shadow-2xs"
                    : "border border-transparent text-secondary hover:bg-surface-hover hover:text-primary"
                )}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-medium truncate">{command.title}</span>
                  {command.description && (
                    <span className="text-xs text-muted truncate">{command.description}</span>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="shrink-0 px-2 py-0.5 text-[11px] font-mono bg-surface-hover text-secondary border border-border-subtle rounded">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      ))
    )}
  </div>
);
