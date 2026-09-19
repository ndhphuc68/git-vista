import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "./useCopyToClipboard";

describe("useCopyToClipboard", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts out not in the copied state", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("writes the exact content to the clipboard", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("a1b2c3d");
    });

    expect(writeText).toHaveBeenCalledWith("a1b2c3d");
  });

  it("sets the copied flag after copying", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("content");
    });

    expect(result.current.copied).toBe(true);
  });

  it("clears the copied flag after COPY_FEEDBACK_MS", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("content");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("clears the timer on unmount, avoiding setState on an unmounted component", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("content");
    });

    clearSpy.mockClear();
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("a second copy is not cut short by the first copy's timer", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("first");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await result.current.copy("second");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // 3000ms have elapsed from the start, but the second timer has only run
    // for 1500ms, so it's still in effect.
    expect(result.current.copied).toBe(true);
  });
});
