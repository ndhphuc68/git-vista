import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RefBadge } from "../../../ipc/bindings.generated";
import { CommitGraphBranchPills } from "./CommitGraphBranchPills";

describe("CommitGraphBranchPills", () => {
  const mockRefs: RefBadge[] = [
    { name: "main", ref_type: "head" },
    { name: "feature/login", ref_type: "local" },
    { name: "origin/feat/83-shopping", ref_type: "remote" },
    { name: "v1.0.0", ref_type: "tag" },
  ];

  it("renders nothing when refs is empty", () => {
    const { container } = render(<CommitGraphBranchPills refs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders primary pill and more refs counter", () => {
    render(<CommitGraphBranchPills refs={mockRefs} />);

    expect(screen.getByTestId("commit-graph-primary-pill")).toBeInTheDocument();
    expect(screen.getAllByText("main")).toHaveLength(2);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders popover items with testids", () => {
    render(<CommitGraphBranchPills refs={mockRefs} />);

    expect(screen.getByTestId("branch-pill-popover-main")).toBeInTheDocument();
    expect(screen.getByTestId("branch-pill-popover-feature/login")).toBeInTheDocument();
    expect(screen.getByTestId("branch-pill-popover-origin/feat/83-shopping")).toBeInTheDocument();
    expect(screen.getByTestId("branch-pill-popover-v1.0.0")).toBeInTheDocument();
  });

  it("triggers onCheckout on double click for non-head local and remote branches", () => {
    const onCheckout = vi.fn();
    render(<CommitGraphBranchPills refs={mockRefs} onCheckout={onCheckout} />);

    const localItem = screen.getByTestId("branch-pill-popover-feature/login");
    fireEvent.doubleClick(localItem);
    expect(onCheckout).toHaveBeenCalledWith("feature/login");

    const remoteItem = screen.getByTestId("branch-pill-popover-origin/feat/83-shopping");
    fireEvent.doubleClick(remoteItem);
    expect(onCheckout).toHaveBeenCalledWith("origin/feat/83-shopping");
  });

  it("does not trigger onCheckout on double click for HEAD or tag", () => {
    const onCheckout = vi.fn();
    render(<CommitGraphBranchPills refs={mockRefs} onCheckout={onCheckout} />);

    const headItem = screen.getByTestId("branch-pill-popover-main");
    fireEvent.doubleClick(headItem);
    expect(onCheckout).not.toHaveBeenCalled();

    const tagItem = screen.getByTestId("branch-pill-popover-v1.0.0");
    fireEvent.doubleClick(tagItem);
    expect(onCheckout).not.toHaveBeenCalled();
  });

  it("applies system theme tokens to popover container and rows", () => {
    render(<CommitGraphBranchPills refs={mockRefs} />);

    const localItem = screen.getByTestId("branch-pill-popover-feature/login");
    expect(localItem).toHaveClass("text-primary");
    expect(localItem).toHaveClass("hover:bg-surface-hover");

    const popoverContainer = localItem.closest(".shadow-2xl");
    expect(popoverContainer).toHaveClass("bg-surface");
    expect(popoverContainer).toHaveClass("border-border-subtle");
    expect(popoverContainer).toHaveClass("text-primary");
  });
});
