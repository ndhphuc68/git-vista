import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { CommitGraphShellDialogs } from "./CommitGraphShellDialogs";
import type { GraphDialogComponents } from "./CommitGraphDialogs";

const REPO = {
  path: "d:/test-repo",
  name: "test-repo",
  is_bare: false,
  head_branch: "main",
  head_commit_id: "c1",
};

const Unused = () => null;

describe("CommitGraphShellDialogs - checkout conflict", () => {
  it("renders the injected CheckoutConflictModal with the failed checkout", () => {
    const onClose = vi.fn();
    const onNavigateToChanges = vi.fn();
    const CheckoutConflictModal: GraphDialogComponents["CheckoutConflictModal"] = (props) => (
      <div data-testid="conflict-modal">
        <span>{`${props.repoPath}|${props.targetBranch}|${props.errorMessage}`}</span>
        <button type="button" onClick={props.onClose}>
          close
        </button>
        <button type="button" onClick={props.onNavigateToChanges}>
          changes
        </button>
      </div>
    );

    render(
      <CommitGraphShellDialogs
        dialog={{
          type: "checkoutConflict",
          targetBranch: "feature",
          errorMessage: "CHECKOUT_CONFLICT: file1.txt",
        }}
        onClose={onClose}
        currentRepo={REPO}
        queryClient={new QueryClient()}
        onNavigateToChanges={onNavigateToChanges}
        CreateTagModal={Unused}
        CreateBranchModal={Unused}
        CheckoutConflictModal={CheckoutConflictModal}
      />
    );

    expect(
      screen.getByText("d:/test-repo|feature|CHECKOUT_CONFLICT: file1.txt")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("close"));
    fireEvent.click(screen.getByText("changes"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onNavigateToChanges).toHaveBeenCalledTimes(1);
  });

  it("does not render the conflict modal for other dialogs", () => {
    const CheckoutConflictModal = vi.fn(() => null);

    render(
      <CommitGraphShellDialogs
        dialog={{ type: "closed" }}
        onClose={vi.fn()}
        currentRepo={REPO}
        queryClient={new QueryClient()}
        onNavigateToChanges={vi.fn()}
        CreateTagModal={Unused}
        CreateBranchModal={Unused}
        CheckoutConflictModal={CheckoutConflictModal}
      />
    );

    expect(CheckoutConflictModal).not.toHaveBeenCalled();
  });
});
