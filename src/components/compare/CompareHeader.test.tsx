import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompareHeader } from "./CompareHeader";
import type { CompareSummary } from "../../ipc/bindings.generated";

const summary: CompareSummary = {
  base_rev: "main",
  target_rev: "feature/login",
  resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  mode: "MergeBase",
  ahead_count: 2,
  behind_count: 1,
  commits: [],
  files: [],
  total_additions: 10,
  total_deletions: 4,
};

function renderHeader(overrides: Partial<React.ComponentProps<typeof CompareHeader>> = {}) {
  return render(
    <CompareHeader
      baseRev="main"
      targetRev="HEAD"
      mode="MergeBase"
      onBaseRevChange={vi.fn()}
      onTargetRevChange={vi.fn()}
      onModeChange={vi.fn()}
      onSwap={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />
  );
}

describe("CompareHeader", () => {
  it("renders the base/target inputs and calls onSwap when the swap button is clicked", () => {
    const onSwap = vi.fn();
    renderHeader({ onSwap });

    const baseInput = screen.getByRole("combobox", { name: /Gốc \(Base\)|Base/i });
    const targetInput = screen.getByRole("combobox", { name: /So với \(Target\)|Target/i });
    expect(baseInput).toHaveValue("main");
    expect(targetInput).toHaveValue("HEAD");

    fireEvent.click(screen.getByRole("button", { name: /Đổi chiều so sánh|Swap base and target/i }));
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("calls onModeChange when a mode toggle button is clicked", () => {
    const onModeChange = vi.fn();
    renderHeader({ onModeChange });

    fireEvent.click(screen.getByRole("button", { name: /Trực tiếp \(A\.\.B\)|Direct \(A\.\.B\)/i }));
    expect(onModeChange).toHaveBeenCalledWith("Direct");
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    renderHeader({ onClose });

    fireEvent.click(screen.getByRole("button", { name: /Đóng|Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the ahead/behind and additions/deletions stats when a summary is present", () => {
    renderHeader({ summary });

    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it("shows the loading indicator when isLoading is true", () => {
    renderHeader({ isLoading: true });

    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });
});
