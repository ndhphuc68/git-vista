import { describe, expect, it, vi } from "vitest";
import { buildModifierShortcuts } from "./useGlobalShortcuts.shortcuts";

function keyEvent(init: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
  return new KeyboardEvent("keydown", init);
}

function runFirstMatch(shortcuts: ReturnType<typeof buildModifierShortcuts>, event: KeyboardEvent) {
  shortcuts.find((shortcut) => shortcut.match(event))?.run(event);
}

describe("buildModifierShortcuts", () => {
  it("dispatches the shortcuts help callback on / or ?", () => {
    const onOpenShortcutsHelp = vi.fn();
    const shortcuts = buildModifierShortcuts({ onOpenShortcutsHelp }, vi.fn());

    const event = keyEvent({ key: "/" });
    const preventDefault = vi.spyOn(event, "preventDefault");
    runFirstMatch(shortcuts, event);

    expect(preventDefault).toHaveBeenCalled();
    expect(onOpenShortcutsHelp).toHaveBeenCalledTimes(1);
  });

  it("dispatches the command palette callback on k/K", () => {
    const onOpenCommandPalette = vi.fn();
    const shortcuts = buildModifierShortcuts({ onOpenCommandPalette }, vi.fn());

    runFirstMatch(shortcuts, keyEvent({ key: "K" }));

    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it("prefers theme toggle over new tab when shift is held", () => {
    const onToggleTheme = vi.fn();
    const onNewTab = vi.fn();
    const shortcuts = buildModifierShortcuts({ onToggleTheme, onNewTab }, vi.fn());

    runFirstMatch(shortcuts, keyEvent({ key: "t", shiftKey: true }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(onNewTab).not.toHaveBeenCalled();
  });

  it("falls back to new tab without shift, then theme toggle if new tab is absent", () => {
    const onToggleTheme = vi.fn();
    const onNewTab = vi.fn();
    const shortcuts = buildModifierShortcuts({ onToggleTheme, onNewTab }, vi.fn());
    runFirstMatch(shortcuts, keyEvent({ key: "t" }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
    expect(onToggleTheme).not.toHaveBeenCalled();

    const themeOnly = buildModifierShortcuts({ onToggleTheme }, vi.fn());
    runFirstMatch(themeOnly, keyEvent({ key: "t" }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("only closes the tab and prevents default when a handler is present", () => {
    const onCloseTab = vi.fn();
    const shortcuts = buildModifierShortcuts({ onCloseTab }, vi.fn());
    const withHandler = keyEvent({ key: "w" });
    const preventDefault = vi.spyOn(withHandler, "preventDefault");
    runFirstMatch(shortcuts, withHandler);
    expect(onCloseTab).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();

    const noHandler = buildModifierShortcuts({}, vi.fn());
    const withoutHandler = keyEvent({ key: "w" });
    const preventDefault2 = vi.spyOn(withoutHandler, "preventDefault");
    runFirstMatch(noHandler, withoutHandler);
    expect(preventDefault2).not.toHaveBeenCalled();
  });

  it("moves to the previous tab on Shift+Tab and next tab on Tab", () => {
    const onPrevTab = vi.fn();
    const onNextTab = vi.fn();
    const shortcuts = buildModifierShortcuts({ onPrevTab, onNextTab }, vi.fn());

    runFirstMatch(shortcuts, keyEvent({ key: "Tab", shiftKey: true }));
    expect(onPrevTab).toHaveBeenCalledTimes(1);
    expect(onNextTab).not.toHaveBeenCalled();

    runFirstMatch(shortcuts, keyEvent({ key: "Tab" }));
    expect(onNextTab).toHaveBeenCalledTimes(1);
  });

  it("switches to the history and changes screens on 1 and 2", () => {
    const setActiveScreen = vi.fn();
    const shortcuts = buildModifierShortcuts({}, setActiveScreen);

    runFirstMatch(shortcuts, keyEvent({ key: "1" }));
    expect(setActiveScreen).toHaveBeenCalledWith("history");

    runFirstMatch(shortcuts, keyEvent({ key: "2" }));
    expect(setActiveScreen).toHaveBeenCalledWith("changes");
  });

  it("dispatches create-branch and settings callbacks", () => {
    const onOpenCreateBranch = vi.fn();
    const onOpenSettings = vi.fn();
    const shortcuts = buildModifierShortcuts({ onOpenCreateBranch, onOpenSettings }, vi.fn());

    runFirstMatch(shortcuts, keyEvent({ key: "B" }));
    expect(onOpenCreateBranch).toHaveBeenCalledTimes(1);

    runFirstMatch(shortcuts, keyEvent({ key: "," }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("matches no entry for an unrelated key", () => {
    const shortcuts = buildModifierShortcuts({}, vi.fn());
    expect(shortcuts.find((shortcut) => shortcut.match(keyEvent({ key: "z" })))).toBeUndefined();
  });
});
