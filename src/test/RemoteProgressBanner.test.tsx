import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  RemoteProgressBanner,
  type RemoteTaskState,
} from "../components/common/RemoteProgressBanner";
import { useSettingsStore } from "../store/useSettingsStore";

describe("RemoteProgressBanner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useSettingsStore.getState().setLocale("vi");
  });

  it("copies the technical error and reports clipboard failures without hiding the error", async () => {
    useSettingsStore.getState().setLocale("en");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const task: RemoteTaskState = {
      taskId: "failed",
      title: "Pushing",
      statusText: "",
      progressPercent: 0,
      status: "error",
      error: {
        title: "Authentication failed",
        message: "Check access",
        rawError: "fatal: permission denied\nexit code 128",
      },
    };
    render(<RemoteProgressBanner task={task} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy technical details" }));
    });
    expect(writeText).toHaveBeenCalledWith("fatal: permission denied\nexit code 128");
    expect(screen.getByRole("status")).toHaveTextContent("Details copied");
    writeText.mockRejectedValue(new Error("Clipboard unavailable"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy technical details" }));
    });
    expect(screen.getByRole("status")).toHaveTextContent("Could not copy");
    expect(screen.getByRole("alert")).toHaveTextContent("Authentication failed");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("renders nothing when task is null", () => {
    const { container } = render(<RemoteProgressBanner task={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders task title, statusText, and percentage when active", () => {
    const mockTask: RemoteTaskState = {
      taskId: "task-1",
      title: "Đang Fetch từ origin",
      statusText: "Counting objects: 45%",
      progressPercent: 45,
    };

    render(<RemoteProgressBanner task={mockTask} />);

    expect(screen.getByText("Đang Fetch từ origin")).toBeInTheDocument();
    expect(screen.getByText("Counting objects: 45%")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "45");
  });

  it("calls onCancel with taskId when cancel button is clicked", () => {
    const mockTask: RemoteTaskState = {
      taskId: "task-99",
      title: "Đang Pull",
      statusText: "Receiving objects: 10%",
      progressPercent: 10,
    };

    const handleCancel = vi.fn();
    render(<RemoteProgressBanner task={mockTask} onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledWith("task-99");
  });
});
