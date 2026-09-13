import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteBranchModal } from "../components/sidebar/DeleteBranchModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    deleteBranch: vi.fn(),
  },
}));

describe("DeleteBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <DeleteBranchModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        branchName="feature/test"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders branch name, backup ref notice, and calls deleteBranch without force initially", async () => {
    const onClose = vi.fn();
    (invokeCommand.deleteBranch as ReturnType<typeof vi.fn>).mockResolvedValue(
      "refs/gitui-backup/delete-branch-test-123"
    );

    render(
      <DeleteBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        branchName="feature/merged"
      />
    );

    expect(screen.getByText("feature/merged")).toBeInTheDocument();
    expect(screen.getByText(/refs\/gitui-backup/i)).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /xoá nhánh/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(invokeCommand.deleteBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/merged",
        false
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles unmerged branch error and prompts for force delete", async () => {
    const onClose = vi.fn();
    (invokeCommand.deleteBranch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("UNMERGED_BRANCH: commit not merged"))
      .mockResolvedValueOnce("refs/gitui-backup/delete-branch-test-123");

    render(
      <DeleteBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        branchName="feature/unmerged"
      />
    );

    const deleteBtn = screen.getByRole("button", { name: /xoá nhánh/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/chưa được gộp/i).length).toBeGreaterThan(0);
    });

    const forceDeleteBtn = screen.getByRole("button", { name: /vẫn xoá/i });
    expect(forceDeleteBtn).toBeInTheDocument();

    fireEvent.click(forceDeleteBtn);

    await waitFor(() => {
      expect(invokeCommand.deleteBranch).toHaveBeenCalledWith(
        "/test/repo",
        "feature/unmerged",
        true
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
