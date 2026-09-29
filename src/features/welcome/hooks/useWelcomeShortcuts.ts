import { useEffect, useRef } from "react";

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
 * old `WelcomeScreen` component. It always calls the latest callbacks; the
 * original captured the first render's.
 */
export function useWelcomeShortcuts({
  openFolder,
  openClone,
  focusSearch,
  clearSearch,
}: UseWelcomeShortcutsOptions): void {
  // Read through a ref so the listener registers once but always calls the
  // callbacks from the latest render.
  const optionsRef = useRef({ openFolder, openClone, focusSearch, clearSearch });
  useEffect(() => {
    optionsRef.current = { openFolder, openClone, focusSearch, clearSearch };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { openFolder, openClone, focusSearch, clearSearch } = optionsRef.current;
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
