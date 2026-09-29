import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { BranchTreeNodeMenu } from "./BranchTreeNodeMenu";

const longCurrentBranch = "feat/2-task-5-inventory-repository-and-usecases-with-a-very-long-name";

function renderMenu() {
  return render(
    <BranchTreeNodeMenu
      branch={{
        name: "feature/other",
        is_head: false,
        target_commit_id: "c1",
        upstream: null,
        ahead: 0,
        behind: 0,
      }}
      menuRef={createRef<HTMLDivElement>()}
      currentBranchName={longCurrentBranch}
      onSetMenuBranch={vi.fn()}
      onCheckout={vi.fn()}
      onMerge={vi.fn()}
      onRebase={vi.fn()}
      onCompare={vi.fn()}
      onRename={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

describe("BranchTreeNodeMenu", () => {
  it("caps the menu width so a long current branch name cannot push it off screen", () => {
    const { container } = renderMenu();
    expect(container.firstElementChild).toHaveClass("max-w-72");
  });

  it("truncates the compare label and exposes the full text as a tooltip", () => {
    renderMenu();
    const label = screen.getByText((text) => text.includes(longCurrentBranch));
    expect(label).toHaveClass("truncate");
    expect(label.closest("button")).toHaveAttribute("title", label.textContent ?? "");
  });
});
