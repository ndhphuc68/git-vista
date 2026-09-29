import { describe, it, expect } from "vitest";
import { buildShortcutSections } from "./shortcutsHelpSections";
import { getTranslation } from "../../i18n";

describe("buildShortcutSections", () => {
  it("builds one section per shortcut category with matching titles", () => {
    const t = getTranslation("en");
    const sections = buildShortcutSections(t);

    expect(sections).toHaveLength(4);
    expect(sections.map((s) => s.title)).toEqual([
      t.shortcuts.categories.general,
      t.shortcuts.categories.navigation,
      t.shortcuts.categories.git,
      t.shortcuts.categories.settings,
    ]);
  });

  it("includes the command palette shortcut with its two key bindings", () => {
    const t = getTranslation("en");
    const sections = buildShortcutSections(t);
    const general = sections[0]!;

    expect(general.items[0]).toEqual({
      label: t.shortcuts.items.commandPalette,
      keys: ["Ctrl+K"],
    });
    expect(general.items[1]!.keys).toEqual(["?", "Ctrl+/"]);
  });

  it("includes the settings screen shortcut sourced from t.settings.title", () => {
    const t = getTranslation("en");
    const sections = buildShortcutSections(t);
    const settings = sections[3]!;

    expect(settings.items[1]).toEqual({ label: t.settings.title, keys: ["Ctrl+,"] });
  });
});
