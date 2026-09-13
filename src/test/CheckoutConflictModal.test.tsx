import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CheckoutConflictModal } from "../components/sidebar/CheckoutConflictModal";

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
});
