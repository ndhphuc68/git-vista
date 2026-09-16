import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommitBox } from "../components/changes/CommitBox";
import { DeleteBranchModal } from "../components/sidebar/DeleteBranchModal";
import { useToastStore } from "../store/useToastStore";
import { invokeCommand } from "../ipc/client";

describe("Undo & Toast Integration", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.restoreAllMocks();
  });

  it("shows toast with undo action after successful commit in CommitBox", async () => {
    vi.spyOn(invokeCommand, "createCommit").mockResolvedValue({ id: "oid123", undo_token: "receipt-123" } as any);
    const undoSpy = vi.spyOn(invokeCommand, "undoCommit").mockResolvedValue(undefined);

    render(
      <CommitBox
        repoPath="/test/repo"
        stagedCount={2}
        onSuccess={vi.fn()}
      />
    );

    const summaryInput = screen.getByPlaceholderText(/Tiêu đề commit/i);
    fireEvent.change(summaryInput, { target: { value: "feat: new feature" } });

    const commitBtn = screen.getByRole("button", { name: /Commit|Lưu thay đổi/i });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      const toast = useToastStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast?.undoAction).toBeDefined();
      expect(toast?.message).toBe("Đã tạo commit");
    });

    // Execute undo callback
    await useToastStore.getState().toasts[0]?.undoAction!();
    expect(undoSpy).toHaveBeenCalledWith("/test/repo", "receipt-123");
  });

  it("shows toast with undo action after deleting branch in DeleteBranchModal", async () => {
    vi.spyOn(invokeCommand, "deleteBranch").mockResolvedValue(
      "refs/gitui-backup/delete-branch-feature-test-123"
    );
    const undoSpy = vi.spyOn(invokeCommand, "undoDeleteBranch").mockResolvedValue(undefined);

    render(
      <DeleteBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        branchName="feature-test"
        onSuccess={vi.fn()}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: /^Xoá nhánh$/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      const toast = useToastStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast?.undoAction).toBeDefined();
      expect(toast?.message).toContain("feature-test");
    });

    await useToastStore.getState().toasts[0]?.undoAction!();
    expect(undoSpy).toHaveBeenCalledWith(
      "/test/repo",
      "feature-test",
      "refs/gitui-backup/delete-branch-feature-test-123"
    );
  });
});
