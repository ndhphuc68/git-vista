import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { CheckoutConflictModal } from "../features/branch";
import { invokeCommand } from "../ipc/client";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CheckoutConflictModal", () => {
  it("does not render when isOpen is false", () => {
    renderWithClient(
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

    renderWithClient(
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

    renderWithClient(
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
  // Pinned before migrating onto the shared Modal: nothing covered the shell
  // (Escape, the close button), which is what the migration replaces.
  describe("closing", () => {
    const props = {
      isOpen: true,
      targetBranch: "feature/next",
      errorMessage: "CHECKOUT_CONFLICT: file1.txt",
      onNavigateToChanges: vi.fn(),
    };

    it("closes on Escape", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button", () => {
      const onClose = vi.fn();
      renderWithClient(<CheckoutConflictModal {...props} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText("Đóng"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("is labelled by its title for screen readers", () => {
      renderWithClient(<CheckoutConflictModal {...props} onClose={vi.fn()} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeTruthy();
    });

    it("hides the stash action when no repo path is given", () => {
      renderWithClient(<CheckoutConflictModal {...props} onClose={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /stash/i })).not.toBeInTheDocument();
    });
  });
});
