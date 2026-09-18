import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CheckoutConflictModal } from "../components/sidebar/CheckoutConflictModal";
import { invokeCommand } from "../ipc/client";

describe("CheckoutConflictModal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <CheckoutConflictModal
        isOpen={false}
        onClose={vi.fn()}
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders conflict details and navigates to changes", () => {
    const onClose = vi.fn();
    const onNavigateToChanges = vi.fn();

    render(
      <CheckoutConflictModal
        isOpen={true}
        onClose={onClose}
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={onNavigateToChanges}
      />
    );

    expect(screen.getByText("feature/next")).toBeInTheDocument();
    expect(screen.getByText("file1.txt")).toBeInTheDocument();

    const navigateBtn = screen.getByRole("button", { name: /đến màn hình thay đổi/i });
    fireEvent.click(navigateBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onNavigateToChanges).toHaveBeenCalled();
  });

  it("renders stash and checkout button and handles stash-and-checkout action", async () => {
    const saveStashSpy = vi.spyOn(invokeCommand, "saveStash").mockResolvedValue("stash123");
    const checkoutBranchSpy = vi
      .spyOn(invokeCommand, "checkoutBranch")
      .mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <CheckoutConflictModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetBranch="feature/next"
        errorMessage="CHECKOUT_CONFLICT: file1.txt"
        onNavigateToChanges={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    const stashBtn = screen.getByRole("button", { name: /lưu tạm \(stash\) rồi chuyển nhánh/i });
    expect(stashBtn).toBeInTheDocument();
    fireEvent.click(stashBtn);

    await waitFor(() => {
      expect(saveStashSpy).toHaveBeenCalledWith(
        "/test/repo",
        expect.stringContaining("feature/next"),
        true
      );
      expect(checkoutBranchSpy).toHaveBeenCalledWith("/test/repo", "feature/next");
      expect(onClose).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    saveStashSpy.mockRestore();
    checkoutBranchSpy.mockRestore();
  });
});
