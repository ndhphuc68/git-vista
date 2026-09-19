import { describe, it, expect, vi } from "vitest";
import { renderHook, fireEvent } from "@testing-library/react";
import { useEscapeKey } from "./useEscapeKey";

function renderTwoHooks(enabledFirst: boolean, enabledSecond: boolean) {
  const first = vi.fn();
  const second = vi.fn();

  const firstHook = renderHook(() => useEscapeKey(enabledFirst, first));
  const secondHook = renderHook(() => useEscapeKey(enabledSecond, second));

  return { first, second, firstHook, secondHook };
}

describe("useEscapeKey", () => {
  it("calls the callback when Escape is pressed while enabled", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback when disabled", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(false, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "a" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount, avoiding a leak", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape));

    unmount();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("uses the latest callback without re-attaching the listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useEscapeKey(true, cb), {
      initialProps: { cb: first },
    });

    rerender({ cb: second });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not re-attach the listener when the callback changes, keeping just one listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");

    const { rerender } = renderHook(({ cb }) => useEscapeKey(true, cb), {
      initialProps: { cb: vi.fn() },
    });

    rerender({ cb: vi.fn() });
    rerender({ cb: vi.fn() });

    const keydownCalls = addSpy.mock.calls.filter(([type]) => type === "keydown");
    expect(keydownCalls).toHaveLength(1);

    addSpy.mockRestore();
  });

  it("when two nested modals are both enabled, Escape only closes the topmost (later-registered) one", () => {
    const { first, second } = renderTwoHooks(true, true);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("after the topmost modal unmounts, the next Escape calls the remaining modal", () => {
    const { first, second, secondHook } = renderTwoHooks(true, true);

    secondHook.unmount();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("a disabled modal (enabled=false) is never called, even when mounted last", () => {
    const { first, second } = renderTwoHooks(true, false);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
