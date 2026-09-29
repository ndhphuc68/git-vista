import { describe, it, expect, vi } from "vitest";
import { createCommandPaletteKeyHandler, executeCommand } from "./commandPaletteHandlers";
import type { CommandItem } from "../../utils/commandRegistry";

function makeCommand(action: () => void): CommandItem {
  return { id: "cmd-1", title: "Command", category: "navigation", action };
}

function makeKeyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLInputElement>;
}

describe("executeCommand", () => {
  it("runs the command action then closes", () => {
    const action = vi.fn();
    const close = vi.fn();
    executeCommand(makeCommand(action), close);
    expect(action).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("logs and still closes when the action throws", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const close = vi.fn();
    const action = vi.fn(() => {
      throw new Error("boom");
    });
    executeCommand(makeCommand(action), close);
    expect(consoleSpy).toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});

describe("createCommandPaletteKeyHandler", () => {
  it("closes on Escape without touching the selection", () => {
    const setSelectedIndex = vi.fn();
    const close = vi.fn();
    const handler = createCommandPaletteKeyHandler({
      filteredCommands: [],
      selectedIndex: 0,
      setSelectedIndex,
      close,
    });
    handler(makeKeyEvent("Escape"));
    expect(close).toHaveBeenCalledTimes(1);
    expect(setSelectedIndex).not.toHaveBeenCalled();
  });

  it("wraps the selection forward on ArrowDown", () => {
    const setSelectedIndex = vi.fn();
    const handler = createCommandPaletteKeyHandler({
      filteredCommands: [makeCommand(vi.fn()), makeCommand(vi.fn())],
      selectedIndex: 1,
      setSelectedIndex,
      close: vi.fn(),
    });
    handler(makeKeyEvent("ArrowDown"));
    expect(setSelectedIndex).toHaveBeenCalledWith(0);
  });

  it("wraps the selection backward on ArrowUp", () => {
    const setSelectedIndex = vi.fn();
    const handler = createCommandPaletteKeyHandler({
      filteredCommands: [makeCommand(vi.fn()), makeCommand(vi.fn())],
      selectedIndex: 0,
      setSelectedIndex,
      close: vi.fn(),
    });
    handler(makeKeyEvent("ArrowUp"));
    expect(setSelectedIndex).toHaveBeenCalledWith(1);
  });

  it("runs the selected command and closes on Enter", () => {
    const action = vi.fn();
    const close = vi.fn();
    const handler = createCommandPaletteKeyHandler({
      filteredCommands: [makeCommand(action)],
      selectedIndex: 0,
      setSelectedIndex: vi.fn(),
      close,
    });
    handler(makeKeyEvent("Enter"));
    expect(action).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("does nothing on navigation keys when there are no filtered commands", () => {
    const setSelectedIndex = vi.fn();
    const handler = createCommandPaletteKeyHandler({
      filteredCommands: [],
      selectedIndex: 0,
      setSelectedIndex,
      close: vi.fn(),
    });
    handler(makeKeyEvent("ArrowDown"));
    expect(setSelectedIndex).not.toHaveBeenCalled();
  });
});
