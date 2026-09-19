import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MergeBranchModal } from "../components/merge/MergeBranchModal";
import { RebaseBranchModal } from "../components/merge/RebaseBranchModal";

describe("MergeBranchModal Component", () => {
  it("renders source and target branch and calls onMerge", async () => {
    const handleMerge = vi.fn().mockResolvedValue({ success: true, status: "Merged", output: "" });
    const handleClose = vi.fn();

    render(
      <MergeBranchModal
        isOpen={true}
        onClose={handleClose}
        currentBranch="main"
        targetBranch="feature/login"
        hasUncommittedChanges={false}
        onMerge={handleMerge}
      />
    );

    expect(screen.getByText("Gộp nhánh (Merge)")).toBeInTheDocument();
    expect(screen.getByText("feature/login")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();

    const mergeBtn = screen.getByRole("button", { name: /Gộp nhánh/i });
    fireEvent.click(mergeBtn);

    await waitFor(() => {
      expect(handleMerge).toHaveBeenCalledWith(false);
    });
  });
});

describe("RebaseBranchModal Component", () => {
  it("renders branch names and calls onRebase", async () => {
    const handleRebase = vi
      .fn()
      .mockResolvedValue({ success: true, status: "Success", output: "" });
    const handleClose = vi.fn();

    render(
      <RebaseBranchModal
        isOpen={true}
        onClose={handleClose}
        currentBranch="feature/login"
        upstreamBranch="main"
        hasUncommittedChanges={false}
        onRebase={handleRebase}
      />
    );

    expect(screen.getByText("Rebase nhánh")).toBeInTheDocument();
    expect(screen.getByText("feature/login")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();

    const rebaseBtn = screen.getByRole("button", { name: "Rebase" });
    fireEvent.click(rebaseBtn);

    await waitFor(() => {
      expect(handleRebase).toHaveBeenCalled();
    });
  });

  it("disables rebase button if has uncommitted changes", () => {
    render(
      <RebaseBranchModal
        isOpen={true}
        onClose={vi.fn()}
        currentBranch="feature/login"
        upstreamBranch="main"
        hasUncommittedChanges={true}
        onRebase={vi.fn()}
      />
    );

    expect(screen.getByText(/Cần working tree sạch để rebase/i)).toBeInTheDocument();
    const rebaseBtn = screen.getByRole("button", { name: "Rebase" });
    expect(rebaseBtn).toBeDisabled();
  });
});

// Pinned before migrating onto the shared Modal: nothing covered the shell
// (isOpen=false, Escape, the close button, cancel), which is exactly what the
// migration replaces (convention #5).
describe("merge and rebase modal shells", () => {
  const mergeProps = {
    isOpen: true,
    currentBranch: "main",
    targetBranch: "feature/x",
    hasUncommittedChanges: false,
    onMerge: vi.fn().mockResolvedValue({ success: true, status: "Merged", output: "" }),
  };

  const rebaseProps = {
    isOpen: true,
    currentBranch: "feature/x",
    upstreamBranch: "main",
    hasUncommittedChanges: false,
    onRebase: vi.fn().mockResolvedValue({ success: true, status: "Rebased", output: "" }),
  };

  describe("MergeBranchModal", () => {
    it("does not render when closed", () => {
      render(<MergeBranchModal {...mergeProps} isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is labelled by its title for screen readers", () => {
      render(<MergeBranchModal {...mergeProps} onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeTruthy();
    });

    it("closes on Escape, the close button and cancel, without merging", () => {
      const onClose = vi.fn();
      const onMerge = vi.fn();
      render(<MergeBranchModal {...mergeProps} onClose={onClose} onMerge={onMerge} />);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText("Đóng"));
      expect(onClose).toHaveBeenCalledTimes(2);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
      expect(onClose).toHaveBeenCalledTimes(3);
      expect(onMerge).not.toHaveBeenCalled();
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      render(<MergeBranchModal {...mergeProps} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("surfaces a conflict result and stays open", async () => {
      const onClose = vi.fn();
      const onMerge = vi
        .fn()
        .mockResolvedValue({ success: false, status: "Conflict", output: "" });
      render(<MergeBranchModal {...mergeProps} onClose={onClose} onMerge={onMerge} />);

      fireEvent.click(screen.getByRole("button", { name: /Gộp nhánh|Merge/i }));

      await waitFor(() => expect(onMerge).toHaveBeenCalled());
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("RebaseBranchModal", () => {
    it("does not render when closed", () => {
      render(<RebaseBranchModal {...rebaseProps} isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is labelled by its title for screen readers", () => {
      render(<RebaseBranchModal {...rebaseProps} onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeTruthy();
    });

    it("closes on Escape, the close button and cancel, without rebasing", () => {
      const onClose = vi.fn();
      const onRebase = vi.fn();
      render(<RebaseBranchModal {...rebaseProps} onClose={onClose} onRebase={onRebase} />);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText("Đóng"));
      expect(onClose).toHaveBeenCalledTimes(2);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
      expect(onClose).toHaveBeenCalledTimes(3);
      expect(onRebase).not.toHaveBeenCalled();
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      render(<RebaseBranchModal {...rebaseProps} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
