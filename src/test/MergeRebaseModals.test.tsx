import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
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

    expect(screen.getByText(/Gop nhanh/i)).toBeInTheDocument();
    expect(screen.getByText("feature/login")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();

    const mergeBtn = screen.getByRole("button", { name: /Gop nhanh/i });
    fireEvent.click(mergeBtn);

    await waitFor(() => {
      expect(handleMerge).toHaveBeenCalledWith(false);
    });
  });
});

describe("RebaseBranchModal Component", () => {
  it("renders branch names and calls onRebase", async () => {
    const handleRebase = vi.fn().mockResolvedValue({ success: true, status: "Success", output: "" });
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

    expect(screen.getByText("Rebase nhanh")).toBeInTheDocument();
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

    expect(screen.getByText(/Can working tree sach de rebase/i)).toBeInTheDocument();
    const rebaseBtn = screen.getByRole("button", { name: "Rebase" });
    expect(rebaseBtn).toBeDisabled();
  });
});
