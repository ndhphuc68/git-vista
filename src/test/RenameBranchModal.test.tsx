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

  // Pinned before migrating onto the shared Modal: this modal focuses AND
  // selects the prefilled name, so typing replaces it outright. Modal's
  // data-autofocus only focuses, so the selection has to be kept explicitly
  // or renaming silently becomes "append to the old name".
  it("focuses the name field and preselects it so typing replaces the old name", async () => {
    render(
      <RenameBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );

    const input = screen.getByLabelText("Tên nhánh mới") as HTMLInputElement;

    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("old-branch".length);
  });

  // Regression guard: the first attempt at preserving the select-on-open
  // behaviour re-ran on every value change, so each keystroke re-selected
  // what had just been typed and the next character wiped it. The preselect
  // must happen once per opening, not once per keystroke.
  it("stops preselecting once the user starts typing", async () => {
    render(
      <RenameBranchModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );

    const input = screen.getByLabelText("Tên nhánh mới") as HTMLInputElement;
    await waitFor(() => expect(document.activeElement).toBe(input));

    fireEvent.change(input, { target: { value: "abc" } });
    await waitFor(() => expect(input.value).toBe("abc"));

    // Caret sits after the typed text; nothing is selected.
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
  });

  describe("closing", () => {
    it("closes on Escape", () => {
      const onClose = vi.fn();
      render(
        <RenameBranchModal
          isOpen={true}
          onClose={onClose}
          repoPath="/test/repo"
          currentName="old-branch"
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      render(
        <RenameBranchModal
          isOpen={false}
          onClose={onClose}
          repoPath="/test/repo"
          currentName="old-branch"
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button and on cancel", () => {
      const onClose = vi.fn();
      render(
        <RenameBranchModal
          isOpen={true}
          onClose={onClose}
          repoPath="/test/repo"
          currentName="old-branch"
        />
      );

      fireEvent.click(screen.getByLabelText("Đóng"));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(invokeCommand.renameBranch).not.toHaveBeenCalled();
    });
  });

  it("surfaces the error and stays open when renaming fails", async () => {
    const onClose = vi.fn();
    (invokeCommand.renameBranch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("name already taken")
    );

    render(
      <RenameBranchModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        currentName="old-branch"
      />
    );
    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "taken" } });
    fireEvent.click(screen.getByRole("button", { name: /đổi tên/i }));

    expect(await screen.findByText(/name already taken/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
