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

  it("ban đầu chưa ở trạng thái đã sao chép", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("ghi đúng nội dung vào clipboard", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("a1b2c3d");
    });

    expect(writeText).toHaveBeenCalledWith("a1b2c3d");
  });

  it("bật cờ copied sau khi sao chép", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });

    expect(result.current.copied).toBe(true);
  });

  it("tự tắt cờ copied sau COPY_FEEDBACK_MS", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("huỷ timer khi unmount, tránh setState trên component đã gỡ", async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });

    unmount();

    expect(() => {
      vi.advanceTimersByTime(2000);
    }).not.toThrow();
  });
});
