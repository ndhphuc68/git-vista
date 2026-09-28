import { useEffect } from "react";

export interface UseWelcomeShortcutsOptions {
  openFolder: () => void;
  openClone: () => void;
  focusSearch: () => void;
  clearSearch: () => void;
}

/**
 * Global Ctrl/Cmd shortcuts local to the welcome screen (open folder, open
 * clone dialog, focus the search input), plus Escape-to-blur-and-clear
 * behaviour on the currently focused input/textarea. Moved intact from the
 * old `WelcomeScreen` component.
 */
export function useWelcomeShortcuts({
  openFolder,
  openClone,
  focusSearch,
  clearSearch,
}: UseWelcomeShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        if (e.key === "Escape") {
          target.blur();
          clearSearch();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        openFolder();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openClone();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        focusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
