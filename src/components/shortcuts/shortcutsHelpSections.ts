import type { useTranslation } from "../../i18n";

export interface ShortcutItem {
  label: string;
  keys: string[];
}

export interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

type Translations = ReturnType<typeof useTranslation>["t"];

/** Builds the static shortcut-help sections from the current translations. */
export function buildShortcutSections(t: Translations): ShortcutSection[] {
  return [
    {
      title: t.shortcuts.categories.general,
      items: [
        { label: t.shortcuts.items.commandPalette, keys: ["Ctrl+K"] },
        { label: t.shortcuts.items.shortcutsHelp, keys: ["?", "Ctrl+/"] },
        { label: t.shortcuts.items.closeModal, keys: ["Esc"] },
      ],
    },
    {
      title: t.shortcuts.categories.navigation,
      items: [
        { label: t.shortcuts.items.historyScreen, keys: ["Ctrl+1"] },
        { label: t.shortcuts.items.changesScreen, keys: ["Ctrl+2"] },
      ],
    },
    {
      title: t.shortcuts.categories.git,
      items: [
        { label: t.shortcuts.items.createBranch, keys: ["Ctrl+B"] },
        { label: t.shortcuts.items.commitChanges, keys: ["Ctrl+Enter"] },
        { label: t.shortcuts.items.fetchRemote, keys: ["Ctrl+Shift+F"] },
        { label: t.shortcuts.items.pullRemote, keys: ["Ctrl+Shift+P"] },
        { label: t.shortcuts.items.pushRemote, keys: ["Ctrl+Shift+U"] },
        { label: t.shortcuts.items.stageAll, keys: ["Ctrl+Shift+A"] },
      ],
    },
    {
      title: t.shortcuts.categories.settings,
      items: [
        { label: t.shortcuts.items.toggleTheme, keys: ["Ctrl+T"] },
        { label: t.settings.title, keys: ["Ctrl+,"] },
      ],
    },
  ];
}
