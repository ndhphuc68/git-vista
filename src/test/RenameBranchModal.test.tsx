import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RenameBranchModal } from "../components/sidebar/RenameBranchModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    renameBranch: vi.fn(),
  },
}));

describe("RenameBranchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <RenameBranchModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with currentName and disables submit until name is changed", () => {
    render(
      <RenameBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );

    const input = screen.getByLabelText("Tên nhánh mới");
    expect(input).toHaveValue("old-branch");

    const submitBtn = screen.getByRole("button", { name: /đổi tên/i });
    expect(submitBtn).toBeDisabled();
  });

  it("submits new name when changed", async () => {
    const onClose = vi.fn();
    (invokeCommand.renameBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <RenameBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );

    const input = screen.getByLabelText("Tên nhánh mới");
    fireEvent.change(input, { target: { value: "renamed-branch" } });

    const submitBtn = screen.getByRole("button", { name: /đổi tên/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.renameBranch).toHaveBeenCalledWith(
        "/test/repo",
        "old-branch",
        "renamed-branch"
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
