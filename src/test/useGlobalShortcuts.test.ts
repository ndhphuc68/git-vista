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
});
