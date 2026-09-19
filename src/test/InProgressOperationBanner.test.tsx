import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InProgressOperationBanner } from "../components/banner/InProgressOperationBanner";
import { type RepoStateInfo } from "../ipc/bindings.generated";

describe("InProgressOperationBanner Component", () => {
  const mockState: RepoStateInfo = {
    state: "merge",
    is_in_progress: true,
    head_name: "main",
    target_name: "feature",
    conflict_count: 2,
  };

  it("renders banner when operation is in progress with abort button", async () => {
    const handleAbort = vi.fn().mockResolvedValue(undefined);
    const handleContinue = vi.fn().mockResolvedValue(undefined);

    render(
      <InProgressOperationBanner
        repoState={mockState}
        onAbort={handleAbort}
        onContinue={handleContinue}
        onNavigateToChanges={vi.fn()}
      />
    );

    expect(screen.getByText(/Đang trong quá trình Merge/i)).toBeInTheDocument();
    expect(screen.getByText(/2 file bị xung đột/i)).toBeInTheDocument();

    const abortBtn = screen.getByRole("button", { name: /Huỷ bỏ/i });
    fireEvent.click(abortBtn);

    await waitFor(() => {
      expect(handleAbort).toHaveBeenCalledWith("merge");
    });
  });

  it("disables continue button if conflict count > 0", () => {
    render(
      <InProgressOperationBanner
        repoState={mockState}
        onAbort={vi.fn()}
        onContinue={vi.fn()}
        onNavigateToChanges={vi.fn()}
      />
    );

    const continueBtn = screen.getByRole("button", { name: /Tiếp tục/i });
    expect(continueBtn).toBeDisabled();
  });

  it("does not render when repoState is clean or not in progress", () => {
    const cleanState: RepoStateInfo = {
      state: "clean",
      is_in_progress: false,
      head_name: "main",
      target_name: null,
      conflict_count: 0,
    };

    const { container } = render(
      <InProgressOperationBanner
        repoState={cleanState}
        onAbort={vi.fn()}
        onContinue={vi.fn()}
        onNavigateToChanges={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
