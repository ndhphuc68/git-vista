import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RemoteProgressBanner, RemoteTaskState } from "../components/common/RemoteProgressBanner";

describe("RemoteProgressBanner", () => {
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
