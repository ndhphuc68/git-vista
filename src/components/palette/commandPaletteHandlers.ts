import type React from "react";
import type { CommandItem } from "../../utils/commandRegistry";

export interface CommandPaletteKeyHandlerContext {
  filteredCommands: CommandItem[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  close: () => void;
}

/** Executes a command, logging (not throwing) on failure, then closes the palette. */
export function executeCommand(cmd: CommandItem, close: () => void): void {
  try {
    cmd.action();
  } catch (err) {
    console.error("Failed to execute command", err);
  }
  close();
}

/**
 * Builds the input's onKeyDown handler for arrow-key navigation, Enter-to-run
 * and Escape-to-close. Kept as a factory over a plain context object so the
 * hook itself stays small while the logic remains identical.
 */
export function createCommandPaletteKeyHandler(context: CommandPaletteKeyHandlerContext) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { filteredCommands, selectedIndex, setSelectedIndex, close } = context;

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
        executeCommand(selected, close);
      }
    }
  };
}
