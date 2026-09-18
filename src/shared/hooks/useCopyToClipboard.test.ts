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
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("nội dung");
    });

    clearSpy.mockClear();
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("copy lần hai không bị timer của lần đầu cắt ngắn phản hồi", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("lần một");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await result.current.copy("lần hai");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Mốc 3000ms tính từ đầu, nhưng timer lần hai mới chạy 1500ms nên vẫn còn hiệu lực
    expect(result.current.copied).toBe(true);
  });
});
