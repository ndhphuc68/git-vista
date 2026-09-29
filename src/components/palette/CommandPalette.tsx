import React from "react";
import { Search } from "lucide-react";
import { type CommandContext } from "../../utils/commandRegistry";
import { Transition } from "../common/Transition";
import { useCommandPalette } from "./useCommandPalette";
import { CommandPaletteList } from "./CommandPaletteList";
import { CommandPaletteFooter } from "./CommandPaletteFooter";

export interface CommandPaletteProps {
  context: CommandContext;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ context }) => {
  const {
    t,
    isOpen,
    query,
    selectedIndex,
    close,
    setQuery,
    setSelectedIndex,
    inputRef,
    itemRefs,
    filteredCommands,
    categories,
    handleKeyDown,
    handleExecute,
  } = useCommandPalette(context);

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

          <CommandPaletteList
            t={t}
            query={query}
            filteredCommands={filteredCommands}
            categories={categories}
            selectedIndex={selectedIndex}
            itemRefs={itemRefs}
            setSelectedIndex={setSelectedIndex}
            onExecute={handleExecute}
          />

          <CommandPaletteFooter t={t} commandCount={filteredCommands.length} />
        </div>
      </div>
    </Transition>
  );
};
