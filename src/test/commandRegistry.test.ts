import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAppCommands, filterCommands, type CommandContext } from "../utils/commandRegistry";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";

describe("Command Palette Store & Registry", () => {
  beforeEach(() => {
    useCommandPaletteStore.getState().close();
  });

  it("manages open/close/toggle state in useCommandPaletteStore", () => {
    const store = useCommandPaletteStore.getState();
    expect(store.isOpen).toBe(false);

    store.open();
    expect(useCommandPaletteStore.getState().isOpen).toBe(true);

    store.setQuery("commit");
    expect(useCommandPaletteStore.getState().query).toBe("commit");

    store.close();
    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    expect(useCommandPaletteStore.getState().query).toBe("");

    store.toggle();
    expect(useCommandPaletteStore.getState().isOpen).toBe(true);

    store.setSelectedIndex(2);
    expect(useCommandPaletteStore.getState().selectedIndex).toBe(2);

    store.toggle();
    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    expect(useCommandPaletteStore.getState().selectedIndex).toBe(0);
  });

  it("builds command list with correct categories and shortcuts", () => {
    const mockNavigate = vi.fn();
    const mockCreateBranch = vi.fn();
    const mockShortcuts = vi.fn();
    const mockToggleTheme = vi.fn();
    const mockToggleMode = vi.fn();

    const ctx: CommandContext = {
      repoPath: "/test/repo",
      navigate: mockNavigate,
      openCreateBranch: mockCreateBranch,
      openShortcutsHelp: mockShortcuts,
      toggleTheme: mockToggleTheme,
      toggleMode: mockToggleMode,
    };

    const commands = getAppCommands(ctx);
    expect(commands.length).toBeGreaterThan(5);

    const historyCmd = commands.find((c) => c.id === "nav-history");
    expect(historyCmd).toBeDefined();
    expect(historyCmd?.shortcut).toBe("Ctrl+1");

    historyCmd?.action();
    expect(mockNavigate).toHaveBeenCalledWith("history");

    const rebaseCmd = commands.find((c) => c.id === "git-interactive-rebase");
    expect(rebaseCmd).toBeDefined();
    expect(rebaseCmd?.category).toBe("git");

    const compareCmd = commands.find((c) => c.id === "git-compare");
    expect(compareCmd).toBeDefined();
    expect(compareCmd?.category).toBe("git");
  });

  it("filters commands by title, keywords, or description", () => {
    const ctx: CommandContext = {
      navigate: vi.fn(),
      openCreateBranch: vi.fn(),
      openShortcutsHelp: vi.fn(),
      toggleTheme: vi.fn(),
      toggleMode: vi.fn(),
    };

    const commands = getAppCommands(ctx);

    const filtered = filterCommands(commands, "nhanh");
    expect(
      filtered.some((c) => c.id.includes("branch") || c.title.toLowerCase().includes("nhánh"))
    ).toBe(true);

    const themeFiltered = filterCommands(commands, "theme");
    expect(themeFiltered.some((c) => c.id.includes("theme"))).toBe(true);

    const emptyFilter = filterCommands(commands, "");
    expect(emptyFilter.length).toBe(commands.length);
  });
});
