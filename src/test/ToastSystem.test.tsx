import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToastContainer } from "../components/toast/ToastContainer";
import { useToastStore } from "../store/useToastStore";

describe("Toast System", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders toast with countdown and handles Undo click", async () => {
    const handleUndo = vi.fn().mockResolvedValue(undefined);

    render(<ToastContainer />);

    useToastStore.getState().showToast({
      message: "Đã tạo commit",
      type: "success",
      durationMs: 10000,
      undoAction: handleUndo,
    });

    expect(screen.getByText("Đã tạo commit")).toBeInTheDocument();
    const undoBtn = screen.getByRole("button", { name: /Hoàn tác/i });
    expect(undoBtn).toBeInTheDocument();

    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(handleUndo).toHaveBeenCalled();
    });
  });

  it("renders friendly error with expandable raw technical details", () => {
    render(<ToastContainer />);

    useToastStore.getState().showError({
      title: "Lỗi xác thực",
      message: "Không thể kết nối",
      rawError: "fatal: Authentication failed",
    });

    expect(screen.getByText("Lỗi xác thực")).toBeInTheDocument();
    const expandBtn = screen.getByRole("button", { name: /Chi tiết kỹ thuật/i });
    fireEvent.click(expandBtn);

    expect(screen.getByText("fatal: Authentication failed")).toBeInTheDocument();
  });

  it("auto-removes toast after duration passes", async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);

    useToastStore.getState().showToast({
      message: "Tự biến mất sau 3s",
      type: "info",
      durationMs: 3000,
    });

    expect(screen.getByText("Tự biến mất sau 3s")).toBeInTheDocument();

    vi.advanceTimersByTime(3100);

    expect(screen.queryByText("Tự biến mất sau 3s")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
