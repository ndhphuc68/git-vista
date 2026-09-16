import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGlobalShortcuts } from "../hooks/useGlobalShortcuts";
import { useViewStore } from "../store/useViewStore";

describe("useGlobalShortcuts", () => {
  beforeEach(() => {
    useViewStore.getState().setActiveScreen("history");
  });

  it("switches screens on Ctrl+1 and Ctrl+2", () => {
    const onOpenCreateBranch = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenCreateBranch }));

    // Press Ctrl+2 -> changes screen
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "2", ctrlKey: true, bubbles: true })
      );
    });
    expect(useViewStore.getState().activeScreen).toBe("changes");

    // Press Ctrl+1 -> history screen
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "1", ctrlKey: true, bubbles: true })
      );
    });
    expect(useViewStore.getState().activeScreen).toBe("history");
  });

  it("triggers onOpenCreateBranch on Ctrl+B", () => {
    const onOpenCreateBranch = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenCreateBranch }));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenCreateBranch).toHaveBeenCalled();
  });

  it("triggers onOpenCommandPalette on Ctrl+K", () => {
    const onOpenCommandPalette = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenCommandPalette }));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it("triggers onOpenShortcutsHelp on ? and Ctrl+/", () => {
    const onOpenShortcutsHelp = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenShortcutsHelp }));

    // Press ?
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "?", bubbles: true })
      );
    });
    expect(onOpenShortcutsHelp).toHaveBeenCalledTimes(1);

    // Press Ctrl+/
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "/", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenShortcutsHelp).toHaveBeenCalledTimes(2);
  });

  it("triggers onToggleTheme on Ctrl+T", () => {
    const onToggleTheme = vi.fn();
    renderHook(() => useGlobalShortcuts({ onToggleTheme }));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "t", ctrlKey: true, bubbles: true })
      );
    });
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("triggers onEscape on Escape", () => {
    const onEscape = vi.fn();
    renderHook(() => useGlobalShortcuts({ onEscape }));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("triggers onOpenSettings on Ctrl+,", () => {
    const onOpenSettings = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenSettings }));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: ",", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts when focus is inside input/textarea", () => {
    const onOpenCommandPalette = vi.fn();
    renderHook(() => useGlobalShortcuts({ onOpenCommandPalette }));

    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenCommandPalette).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("does not trigger callbacks when enabled is false", () => {
    const onOpenCommandPalette = vi.fn();
    renderHook(() =>
      useGlobalShortcuts({ onOpenCommandPalette, enabled: false })
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
      );
    });
    expect(onOpenCommandPalette).not.toHaveBeenCalled();
  });
});
