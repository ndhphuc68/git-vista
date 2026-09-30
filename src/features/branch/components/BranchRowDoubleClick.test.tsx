import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { BranchLeafRow } from "./BranchLeafRow";
import { RemoteBranchRow } from "./RemoteBranchRow";

const branch = {
  name: "feature",
  is_head: false,
  target_commit_id: "abc",
  upstream: null,
  ahead: 0,
  behind: 0,
};

describe("branch rows - double click", () => {
  it("checks out a local branch once per double click on its name", () => {
    const onCheckout = vi.fn();
    render(
      <BranchLeafRow
        branch={branch}
        name="feature"
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
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.doubleClick(screen.getByText("feature"));

    expect(onCheckout).toHaveBeenCalledTimes(1);
    expect(onCheckout).toHaveBeenCalledWith("feature");
  });

  it("checks out a remote branch once per double click on its name", () => {
    const onCheckout = vi.fn();
    render(
      <RemoteBranchRow
        branchName="origin/feature"
        name="feature"
        selectedBranch={null}
        onSelectBranch={vi.fn()}
        menuBranch={null}
        onSetMenuBranch={vi.fn()}
        menuRef={createRef<HTMLDivElement>()}
        currentBranchName="main"
        onCheckout={onCheckout}
        onOpenDialog={vi.fn()}
      />
    );

    fireEvent.doubleClick(screen.getByText("feature"));

    expect(onCheckout).toHaveBeenCalledTimes(1);
    expect(onCheckout).toHaveBeenCalledWith("origin/feature");
  });
});
