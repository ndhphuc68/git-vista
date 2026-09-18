import React, { useEffect, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import { useCommandPaletteStore } from "../../store/useCommandPaletteStore";
import {
  type CommandContext,
  type CommandItem,
  type CommandCategory,
  getAppCommands,
  filterCommands,
} from "../../utils/commandRegistry";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

export interface CommandPaletteProps {
  context: CommandContext;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ context }) => {
  const { t } = useTranslation();
  const { isOpen, query, selectedIndex, close, setQuery, setSelectedIndex } =
    useCommandPaletteStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const categoryLabels: Record<CommandCategory, string> = useMemo(
    () => ({
      navigation: t.palette.categories.navigation,
      branch: t.palette.categories.branch,
      git: t.palette.categories.git,
      settings: t.palette.categories.settings,
    }),
    [t]
  );

  const allCommands = useMemo(() => getAppCommands(context, t), [context, t]);
  const filteredCommands = useMemo(() => filterCommands(allCommands, query), [allCommands, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, close]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = itemRefs.current[selectedIndex];
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    if (filteredCommands.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((selectedIndex - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        try {
          selected.action();
        } catch (err) {
          console.error("Failed to execute command", err);
        }
        close();
      }
    }
  };

  const handleExecute = (cmd: CommandItem) => {
    try {
      cmd.action();
    } catch (err) {
      console.error("Failed to execute command", err);
    }
    close();
  };

  // Group filtered commands by category while preserving flat indices
  const categories: {
    category: CommandCategory;
    label: string;
    items: { command: CommandItem; flatIndex: number }[];
  }[] = [];

  const categoryMap = new Map<CommandCategory, { command: CommandItem; flatIndex: number }[]>();

  filteredCommands.forEach((cmd, idx) => {
    const list = categoryMap.get(cmd.category) || [];
    list.push({ command: cmd, flatIndex: idx });
    categoryMap.set(cmd.category, list);
  });

  categoryMap.forEach((items, cat) => {
    categories.push({
      category: cat,
      label: categoryLabels[cat] || cat,
      items,
    });
  });

  return (
    <Transition
      show={isOpen}
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 z-[9999] modal-backdrop flex justify-center pt-20 px-4"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-border-subtle gap-3">
            <Search size={18} className="text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${t.palette.inputPlaceholder} (Ctrl+K)`}
              autoFocus
              className="w-full bg-transparent text-primary placeholder-muted outline-none text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-secondary hover:text-primary px-1.5 py-0.5 rounded hover:bg-surface-hover cursor-pointer"
              >
                {t.palette.clear}
              </button>
            )}
          </div>

          {/* Command List */}
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
                        onClick={() => handleExecute(command)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-accent-subtle/40 border-l-2 border-accent text-primary"
                            : "border-l-2 border-transparent text-secondary hover:bg-surface-hover hover:text-primary"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-medium truncate">{command.title}</span>
                          {command.description && (
                            <span className="text-xs text-muted truncate">
                              {command.description}
                            </span>
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

          {/* Footer shortcuts */}
          <div className="px-4 py-2 bg-surface-hover/50 border-t border-border-subtle flex items-center justify-between text-xs text-muted select-none">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
                  ↑↓
                </kbd>{" "}
                {t.palette.navigateHint}
              </span>
              <span>
                <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
                  Enter
                </kbd>{" "}
                {t.palette.executeHint}
              </span>
              <span>
                <kbd className="font-mono bg-surface px-1 py-0.5 border border-border-subtle rounded text-[11px]">
                  Esc
                </kbd>{" "}
                {t.palette.closeHint}
              </span>
            </div>
            <div className="text-[11px]">
              {t.palette.commandsCount.replace("{count}", String(filteredCommands.length))}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
