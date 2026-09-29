import { useEffect } from "react";
import { useViewStore } from "../store/useViewStore";
import { buildModifierShortcuts } from "./useGlobalShortcuts.shortcuts";

export interface UseGlobalShortcutsOptions {
  onOpenCreateBranch?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const {
    onOpenCreateBranch,
    onOpenCommandPalette,
    onOpenShortcutsHelp,
    onToggleTheme,
    onOpenSettings,
    onNewTab,
    onCloseTab,
    onNextTab,
    onPrevTab,
    onEscape,
    enabled = true,
  } = options;
  const { setActiveScreen } = useViewStore();

  useEffect(() => {
    if (!enabled) return;

    const modifierShortcuts = buildModifierShortcuts(
      {
        onOpenCreateBranch,
        onOpenCommandPalette,
        onOpenShortcutsHelp,
        onToggleTheme,
        onOpenSettings,
        onNewTab,
        onCloseTab,
        onNextTab,
        onPrevTab,
      },
      setActiveScreen
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape can always trigger
      if (e.key === "Escape") {
        if (onEscape) onEscape();
        return;
      }

      // Ignore when user is actively editing text in form elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      if (!isModifier && e.key === "?") {
        e.preventDefault();
        if (onOpenShortcutsHelp) {
          onOpenShortcutsHelp();
        }
        return;
      }

      if (!isModifier) return;

      modifierShortcuts.find((shortcut) => shortcut.match(e))?.run(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    onOpenCreateBranch,
    onOpenCommandPalette,
    onOpenShortcutsHelp,
    onToggleTheme,
    onOpenSettings,
    onNewTab,
    onCloseTab,
    onNextTab,
    onPrevTab,
    onEscape,
    setActiveScreen,
  ]);
}
