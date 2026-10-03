import { describe, it, expect, vi } from "vitest";
import { createRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BranchLeafRow } from "./BranchLeafRow";

function Harness() {
  const [menuBranch, setMenuBranch] = useState<string | null>(null);
  return (
    <BranchLeafRow
      branch={{
        name: "feature/x",
        is_head: false,
        target_commit_id: "c1",
        upstream: null,
        ahead: 0,
        behind: 0,
      }}
      name="x"
      selectedBranch={null}
      onSelectBranch={vi.fn()}
      menuBranch={menuBranch}
      onSetMenuBranch={setMenuBranch}
      menuRef={createRef<HTMLDivElement>()}
      currentBranchName="main"
      onCheckout={vi.fn()}
      onMerge={vi.fn()}
      onRebase={vi.fn()}
      onCompare={vi.fn()}
      onCreateBranchFrom={vi.fn()}
      onRename={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

describe("BranchLeafRow", () => {
  it("highlights the row whose context menu is open", () => {
    const { container } = render(<Harness />);
    const row = container.firstElementChild as HTMLElement;
    expect(row).not.toHaveClass("bg-surface-hover");

    fireEvent.contextMenu(screen.getByText("x"));

    expect(row).toHaveClass("bg-surface-hover");
  });

  it("triggers onCheckout when double-clicking a non-head branch row", () => {
    const onCheckout = vi.fn();
    render(
      <BranchLeafRow
        branch={{
          name: "feature/beta",
          is_head: false,
          target_commit_id: "c2",
          upstream: null,
          ahead: 0,
          behind: 0,
        }}
        name="beta"
        selectedBranch={null}
        onSelectBranch={vi.fn()}
        menuBranch={null}
        onSetMenuBranch={vi.fn()}
        menuRef={createRef<HTMLDivElement>()}
        currentBranchName="main"
        onCheckout={onCheckout}
        onMerge={vi.fn()}
        onRebase={vi.fn()}
        onCompare={vi.fn()}
        onCreateBranchFrom={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.doubleClick(screen.getByText("beta"));
    expect(onCheckout).toHaveBeenCalledWith("feature/beta");
  });

  it("does not trigger onCheckout when double-clicking a HEAD branch row", () => {
    const onCheckout = vi.fn();
    render(
      <BranchLeafRow
        branch={{
          name: "main",
          is_head: true,
          target_commit_id: "c1",
          upstream: null,
          ahead: 0,
          behind: 0,
        }}
        name="main"
        selectedBranch={null}
        onSelectBranch={vi.fn()}
        menuBranch={null}
        onSetMenuBranch={vi.fn()}
        menuRef={createRef<HTMLDivElement>()}
        currentBranchName="main"
        onCheckout={onCheckout}
        onMerge={vi.fn()}
        onRebase={vi.fn()}
        onCompare={vi.fn()}
        onCreateBranchFrom={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.doubleClick(screen.getByText("main"));
    expect(onCheckout).not.toHaveBeenCalled();
  });
});
