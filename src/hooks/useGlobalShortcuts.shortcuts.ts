import type { ActiveScreen } from "../store/useViewStore";

export interface ModifierShortcutCallbacks {
  onOpenCreateBranch?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

export interface ModifierShortcutEntry {
  match: (e: KeyboardEvent) => boolean;
  run: (e: KeyboardEvent) => void;
}

function runToggleTheme(callbacks: ModifierShortcutCallbacks) {
  return (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.shiftKey && callbacks.onToggleTheme) {
      callbacks.onToggleTheme();
    } else if (callbacks.onNewTab) {
      callbacks.onNewTab();
    } else if (callbacks.onToggleTheme) {
      callbacks.onToggleTheme();
    }
  };
}

function runCloseTab(callbacks: ModifierShortcutCallbacks) {
  return (e: KeyboardEvent) => {
    if (callbacks.onCloseTab) {
      e.preventDefault();
      callbacks.onCloseTab();
    }
  };
}

function runTabCycle(callbacks: ModifierShortcutCallbacks) {
  return (e: KeyboardEvent) => {
    if (e.shiftKey && callbacks.onPrevTab) {
      e.preventDefault();
      callbacks.onPrevTab();
    } else if (callbacks.onNextTab) {
      e.preventDefault();
      callbacks.onNextTab();
    }
  };
}

/**
 * Builds the ordered list of Ctrl/Cmd-modified shortcut handlers used by
 * `useGlobalShortcuts`. Entries are tried in order and the first whose
 * `match` returns true has its `run` invoked, mirroring the original
 * if/else-if chain (each entry's key is mutually exclusive with the others).
 */
export function buildModifierShortcuts(
  callbacks: ModifierShortcutCallbacks,
  setActiveScreen: (screen: ActiveScreen) => void
): ModifierShortcutEntry[] {
  return [
    {
      match: (e) => e.key === "/" || e.key === "?",
      run: (e) => {
        e.preventDefault();
        callbacks.onOpenShortcutsHelp?.();
      },
    },
    {
      match: (e) => e.key === "k" || e.key === "K",
      run: (e) => {
        e.preventDefault();
        callbacks.onOpenCommandPalette?.();
      },
    },
    { match: (e) => e.key === "t" || e.key === "T", run: runToggleTheme(callbacks) },
    { match: (e) => e.key === "w" || e.key === "W", run: runCloseTab(callbacks) },
    { match: (e) => e.key === "Tab", run: runTabCycle(callbacks) },
    {
      match: (e) => e.key === "1",
      run: (e) => {
        e.preventDefault();
        setActiveScreen("history");
      },
    },
    {
      match: (e) => e.key === "2",
      run: (e) => {
        e.preventDefault();
        setActiveScreen("changes");
      },
    },
    {
      match: (e) => e.key === "b" || e.key === "B",
      run: (e) => {
        e.preventDefault();
        callbacks.onOpenCreateBranch?.();
      },
    },
    {
      match: (e) => e.key === "," || e.key === "<",
      run: (e) => {
        e.preventDefault();
        callbacks.onOpenSettings?.();
      },
    },
  ];
}
