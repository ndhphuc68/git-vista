import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteBranchModal } from "../features/branch";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    deleteBranch: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("DeleteBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    renderWithClient(
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

    renderWithClient(
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

    renderWithClient(
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
  // Pinned before migrating onto the shared Modal: nothing covered the shell
  // (Escape, the close button, cancel), which is exactly what the migration
  // replaces (convention #5).
  describe("closing", () => {
    const props = {
      isOpen: true,
      repoPath: "/test/repo",
      branchName: "feature/x",
    };

    it("closes on Escape", () => {
      const onClose = vi.fn();
      renderWithClient(<DeleteBranchModal {...props} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      renderWithClient(<DeleteBranchModal {...props} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button and on cancel, without deleting", () => {
      const onClose = vi.fn();
      renderWithClient(<DeleteBranchModal {...props} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText("Đóng"));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(invokeCommand.deleteBranch).not.toHaveBeenCalled();
    });

    it("is labelled by its title for screen readers", () => {
      renderWithClient(<DeleteBranchModal {...props} onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toHaveTextContent(/xoá nhánh/i);
    });
  });
});
