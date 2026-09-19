import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DiscardConfirmModal } from "../components/changes/DiscardConfirmModal";

/**
 * Characterization tests: these describe the behaviour the modal had BEFORE
 * being migrated onto the shared Modal primitive, so the migration can be
 * proven to be a mechanical replacement rather than a behaviour change.
 */
describe("DiscardConfirmModal", () => {
  const defaults = {
    isOpen: true,
    filePath: "src/components/Foo.tsx",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("does not render when isOpen is false", () => {
    render(<DiscardConfirmModal {...defaults} isOpen={false} onCancel={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render when there is no file path", () => {
    render(<DiscardConfirmModal {...defaults} filePath={null} onCancel={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // isOpen and filePath each independently hide the modal, so a caller-level
  // test cannot tell them apart (clearing the path also closes it). Pinning
  // isOpen here with a path still present is what keeps that prop honest.
  it("does not render when isOpen is false even though a file path is set", () => {
    render(
      <DiscardConfirmModal
        {...defaults}
        isOpen={false}
        filePath="src/still/here.ts"
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("src/still/here.ts")).not.toBeInTheDocument();
  });

  it("shows the title, the warning and the file path", () => {
    render(<DiscardConfirmModal {...defaults} onCancel={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // The title and the confirm button share the same label text, so this
    // must be scoped to the heading to stay unambiguous.
    expect(screen.getByRole("heading", { name: "Huỷ thay đổi" })).toBeInTheDocument();
    expect(
      screen.getByText(/các thay đổi trong file này sẽ bị huỷ vĩnh viễn/i)
    ).toBeInTheDocument();
    expect(screen.getByText("src/components/Foo.tsx")).toBeInTheDocument();
  });

  it("is labelled by its title for screen readers", () => {
    render(<DiscardConfirmModal {...defaults} onCancel={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent("Huỷ thay đổi");
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(<DiscardConfirmModal {...defaults} onConfirm={onConfirm} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByTestId("confirm-discard-button"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<DiscardConfirmModal {...defaults} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId("cancel-discard-button"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the header close button is clicked", () => {
    const onCancel = vi.fn();
    render(<DiscardConfirmModal {...defaults} onCancel={onCancel} />);

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(<DiscardConfirmModal {...defaults} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not react to Escape while closed", () => {
    const onCancel = vi.fn();
    render(<DiscardConfirmModal {...defaults} isOpen={false} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("confirming does not also fire cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DiscardConfirmModal {...defaults} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId("confirm-discard-button"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
