import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useEscapeKey } from "./useEscapeKey";

describe("useEscapeKey", () => {
  it("gọi callback khi bấm Escape lúc đang bật", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("không gọi callback khi đang tắt", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(false, onEscape));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("bỏ qua các phím khác", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "a" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("gỡ listener khi unmount, tránh rò rỉ", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape));

    unmount();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("dùng callback mới nhất mà không cần gắn lại listener", () => {
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

  it("không gắn lại listener khi callback đổi, chỉ giữ một listener duy nhất", () => {
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
});
