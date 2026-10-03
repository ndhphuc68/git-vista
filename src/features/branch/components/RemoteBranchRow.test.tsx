import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { RemoteBranchRow } from "./RemoteBranchRow";

function setup(selectedBranch: string | null = null, menuBranch: string | null = null) {
  const onOpenDialog = vi.fn();
  render(
    <RemoteBranchRow
      branchName="origin/feature"
      name="feature"
      selectedBranch={selectedBranch}
      onSelectBranch={vi.fn()}
      menuBranch={menuBranch}
      onSetMenuBranch={vi.fn()}
      menuRef={createRef<HTMLDivElement>()}
      currentBranchName="main"
      onCheckout={vi.fn()}
      onOpenDialog={onOpenDialog}
    />
  );
  return { onOpenDialog };
}

describe("RemoteBranchRow", () => {
  it("renders with transparent background when unselected", () => {
    setup(null);
    const button = screen.getByRole("button", { name: "origin/feature" });
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("text-primary");
    expect(button).not.toHaveClass("text-accent");
    expect(button).not.toHaveClass("bg-surface-active");
  });

  it("renders with subtle surface-active background and primary text when selected", () => {
    setup("origin/feature");
    const button = screen.getByRole("button", { name: "origin/feature" });
    expect(button).toHaveClass("bg-surface-active");
    expect(button).toHaveClass("text-primary");
    expect(button).not.toHaveClass("text-accent");
    expect(button).not.toHaveClass("bg-accent-subtle");
  });

  it("opens the create-branch dialog starting at the remote branch", () => {
    const { onOpenDialog } = setup(null, "origin/feature");
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhánh mới từ nhánh này" }));
    expect(onOpenDialog).toHaveBeenCalledWith({
      kind: "createBranch",
      fromRef: "refs/remotes/origin/feature",
      fromBranch: "origin/feature",
    });
  });
});
