import { useEffect } from "react";
import { useViewStore } from "../store/useViewStore";

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
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
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

      if (isModifier) {
        if (e.key === "/" || e.key === "?") {
          e.preventDefault();
          if (onOpenShortcutsHelp) {
            onOpenShortcutsHelp();
          }
        } else if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          if (onOpenCommandPalette) {
            onOpenCommandPalette();
          }
        } else if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          if (e.shiftKey && onToggleTheme) {
            onToggleTheme();
          } else if (onNewTab) {
            onNewTab();
          } else if (onToggleTheme) {
            onToggleTheme();
          }
        } else if (e.key === "w" || e.key === "W") {
          if (onCloseTab) {
            e.preventDefault();
            onCloseTab();
          }
        } else if (e.key === "Tab") {
          if (e.shiftKey && onPrevTab) {
            e.preventDefault();
            onPrevTab();
          } else if (onNextTab) {
            e.preventDefault();
            onNextTab();
          }
        } else if (e.key === "1") {
          e.preventDefault();
          setActiveScreen("history");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveScreen("changes");
        } else if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          if (onOpenCreateBranch) {
            onOpenCreateBranch();
          }
        } else if (e.key === "," || e.key === "<") {
          e.preventDefault();
          if (onOpenSettings) {
            onOpenSettings();
          }
        }
      }
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
