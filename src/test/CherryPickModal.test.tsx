import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CherryPickModal } from "../components/modals/CherryPickModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    cherryPickCommit: vi.fn(),
  },
}));

describe("CherryPickModal", () => {
  const dummyCommit = {
    id: "a1b2c3d4e5f6789012345678901234567890abcd",
    short_id: "a1b2c3d",
    summary: "feat: add user authentication",
    author: "Alice Smith",
    time: "2 hours ago",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render dialog when isOpen is false", () => {
    render(
      <CherryPickModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
        currentBranch="main"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders target commit details and current destination branch", () => {
    render(
      <CherryPickModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
        currentBranch="feature/payments"
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("a1b2c3d")).toBeInTheDocument();
    expect(screen.getByText("feat: add user authentication")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("feature/payments")).toBeInTheDocument();
  });

  it("has auto-commit checkbox checked by default", () => {
    render(
      <CherryPickModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
        currentBranch="main"
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
      new_commit_id: "998877665544",
      undo_token: "refs/gitui-backup/undo-123",
      output: "Finished cherry-pick",
    };

    (invokeCommand.cherryPickCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <CherryPickModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
        currentBranch="main"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /^cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.cherryPickCommit).toHaveBeenCalledWith(
        "/test/repo",
        "a1b2c3d4e5f6789012345678901234567890abcd",
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
      output: "Changes staged",
    };

    (invokeCommand.cherryPickCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <CherryPickModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
        currentBranch="main"
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /^cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.cherryPickCommit).toHaveBeenCalledWith(
        "/test/repo",
        "a1b2c3d4e5f6789012345678901234567890abcd",
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
      output: "CONFLICT (content): Merge conflict in file.txt",
    };

    (invokeCommand.cherryPickCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <CherryPickModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /^cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.cherryPickCommit).toHaveBeenCalled();
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
      output: "Repository is dirty. Please clean working tree first.",
    };

    (invokeCommand.cherryPickCommit as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(
      <CherryPickModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommit={dummyCommit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /^cherry-pick$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Repository is dirty. Please clean working tree first.")
      ).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("closes when cancel button is clicked or Escape key pressed", () => {
    const onClose = vi.fn();
    render(
      <CherryPickModal
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
