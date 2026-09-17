import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RevertModal } from "../components/modals/RevertModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    revertCommit: vi.fn(),
  },
}));

describe("RevertModal", () => {
  const dummyCommit = {
    id: "f1e2d3c4b5a6789012345678901234567890fedc",
    short_id: "f1e2d3c",
    summary: "fix: broken layout on mobile",
    author: "Bob Jones",
    time: "Yesterday",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render dialog when isOpen is false", () => {
    render(
      <RevertModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders target commit details and description warning banner", () => {
    render(
      <RevertModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("f1e2d3c")).toBeInTheDocument();
    expect(screen.getByText("fix: broken layout on mobile")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    // Warning banner description text
    expect(screen.getByText(/Thao tác này sẽ tạo một commit mới/i)).toBeInTheDocument();
  });

  it("has auto-commit checkbox checked by default", () => {
    render(
      <RevertModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(true);
  });

  it("submits with autoCommit: true by default and handles success", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const mockResult = {
      success: true,
      status: "Committed",
      new_commit_id: "112233445566",
      undo_token: "refs/gitui-backup/undo-revert",
      output: "Revert completed",
    };

    (invokeCommand.revertCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <RevertModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /hoàn tác commit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.revertCommit).toHaveBeenCalledWith(
        "/test/repo",
        "f1e2d3c4b5a6789012345678901234567890fedc",
        true
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("submits with autoCommit: false when unchecked", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const mockResult = {
      success: true,
      status: "Staged",
      new_commit_id: null,
      undo_token: null,
      output: "Revert changes staged",
    };

    (invokeCommand.revertCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <RevertModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /hoàn tác commit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.revertCommit).toHaveBeenCalledWith(
        "/test/repo",
        "f1e2d3c4b5a6789012345678901234567890fedc",
        false
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles conflict result by calling onSuccess and onClose", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const mockResult = {
      success: false,
      status: "Conflict",
      new_commit_id: null,
      undo_token: null,
      output: "CONFLICT (content): Merge conflict in layout.tsx",
    };

    (invokeCommand.revertCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <RevertModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /hoàn tác commit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.revertCommit).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles generic error without closing modal", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const mockResult = {
      success: false,
      status: "Error",
      new_commit_id: null,
      undo_token: null,
      output: "Unfinished rebase in progress.",
    };

    (invokeCommand.revertCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <RevertModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /hoàn tác commit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Unfinished rebase in progress.")).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("closes when cancel button is clicked or Escape key pressed", () => {
    const onClose = vi.fn();
    render(
      <RevertModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
