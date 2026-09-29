import { useEffect, useMemo, useRef } from "react";
import type React from "react";
import { useCommandPaletteStore } from "../../store/useCommandPaletteStore";
import {
  type CommandContext,
  type CommandCategory,
  type CommandItem,
  getAppCommands,
  filterCommands,
} from "../../utils/commandRegistry";
import { useTranslation } from "../../i18n";
import { groupCommandsByCategory, type CommandCategoryGroup } from "./commandPaletteHelpers";
import { createCommandPaletteKeyHandler, executeCommand } from "./commandPaletteHandlers";

export interface UseCommandPaletteResult {
  t: ReturnType<typeof useTranslation>["t"];
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  close: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  itemRefs: React.RefObject<(HTMLButtonElement | null)[]>;
  filteredCommands: CommandItem[];
  categories: CommandCategoryGroup[];
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleExecute: (cmd: CommandItem) => void;
}

/**
 * Holds all CommandPalette state, effects and handlers so the component
 * itself stays a thin render function. Behaviour (focus, keyboard
 * navigation, filtering, scroll-into-view) is unchanged from the original
 * inline implementation.
 */
export function useCommandPalette(context: CommandContext): UseCommandPaletteResult {
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

  const handleKeyDown = createCommandPaletteKeyHandler({
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    close,
  });

  const handleExecute = (cmd: CommandItem) => executeCommand(cmd, close);

  const categories = groupCommandsByCategory(filteredCommands, categoryLabels);

  return {
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
  };
}
