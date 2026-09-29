import { describe, it, expect, vi } from "vitest";
import { createRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BranchLeafRow } from "./BranchLeafRow";

function Harness() {
  const [menuBranch, setMenuBranch] = useState<string | null>(null);
  return (
    <BranchLeafRow
      branch={{ name: "feature/x", is_head: false, target_commit_id: "c1", upstream: null, ahead: 0, behind: 0 }}
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
});
