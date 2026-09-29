import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastItem } from "../components/toast/ToastItem";
import { useToastStore, type ToastItem as ToastItemType } from "../store/useToastStore";

function makeToast(overrides: Partial<ToastItemType> = {}): ToastItemType {
  return {
    id: "toast-1",
    type: "success",
    message: "Saved successfully",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("ToastItem", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the message and removes itself when the close button is clicked", () => {
    const removeSpy = vi.spyOn(useToastStore.getState(), "removeToast");
    const toast = makeToast();
    render(<ToastItem toast={toast} />);

    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close|đóng/i }));
    expect(removeSpy).toHaveBeenCalledWith("toast-1");
  });

  it("auto-dismisses after durationMs elapses", () => {
    vi.useFakeTimers();
    const removeSpy = vi.spyOn(useToastStore.getState(), "removeToast");
    const toast = makeToast({ durationMs: 3000 });
    render(<ToastItem toast={toast} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(removeSpy).toHaveBeenCalledWith("toast-1");
  });

  it("toggles technical details for a raw error and does not auto-dismiss", () => {
    vi.useFakeTimers();
    const toast = makeToast({
      type: "error",
      message: "Push failed",
      rawError: "fatal: rejected",
    });
    render(<ToastItem toast={toast} />);

    expect(screen.queryByText("fatal: rejected")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/technical details|chi tiết/i));
    expect(screen.getByText("fatal: rejected")).toBeInTheDocument();
  });

  it("runs the undo action then removes the toast, even on failure", async () => {
    const removeSpy = vi.spyOn(useToastStore.getState(), "removeToast");
    const undoAction = vi.fn().mockRejectedValue(new Error("undo failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const toast = makeToast({ undoAction, undoLabel: "Undo" });
    render(<ToastItem toast={toast} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    });

    expect(undoAction).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith("toast-1");
  });
});
