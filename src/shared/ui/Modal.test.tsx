import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Z_INDEX } from "../../domain/constants/zIndex";

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Modal isOpen onClose={onClose} labelledBy="test-title" {...props}>
      <Modal.Header title="Tiêu đề thử" onClose={onClose} titleId="test-title" />
      <Modal.Body>
        <p>Nội dung thân modal</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Huỷ</Button>
      </Modal.Footer>
    </Modal>
  );
  return { ...utils, onClose };
}

describe("Modal", () => {
  it("renders its content when open", () => {
    renderModal();
    expect(screen.getByText("Nội dung thân modal")).toBeInTheDocument();
    expect(screen.getByText("Tiêu đề thử")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Nội dung thân modal")).not.toBeInTheDocument();
  });

  it("has role=dialog and aria-modal for accessibility", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("links the title via aria-labelledby", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "test-title");
  });

  it("calls onClose when Escape is pressed", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking outside the content area", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when clicking inside the content area", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByText("Nội dung thân modal"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when clicking the X button in the header", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not react to Escape while the modal is closed", () => {
    const { onClose } = renderModal({ isOpen: false });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close on Escape when closeOnEscape=false", () => {
    const { onClose } = renderModal({ closeOnEscape: false });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close on outside click when closeOnBackdrop=false", () => {
    const { onClose } = renderModal({ closeOnBackdrop: false });

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("different sizes produce different width classes", () => {
    const { rerender } = renderModal({ size: "sm" });
    const smallPanel = screen.getByTestId("modal-panel").className;

    rerender(
      <Modal isOpen onClose={vi.fn()} size="xl" labelledBy="test-title">
        <Modal.Body>X</Modal.Body>
      </Modal>
    );
    const largePanel = screen.getByTestId("modal-panel").className;

    expect(smallPanel).not.toBe(largePanel);
  });

  it("defaults to the regular modal z-index layer", () => {
    renderModal();
    const backdrop = screen.getByTestId("modal-backdrop");

    expect(backdrop.style.zIndex).toBe(String(Z_INDEX.modal));
  });

  it("with stacked=true, uses a z-index layer higher than the regular modal", () => {
    renderModal({ stacked: true });
    const backdrop = screen.getByTestId("modal-backdrop");

    expect(backdrop.style.zIndex).toBe(String(Z_INDEX.modalStacked));
    expect(Z_INDEX.modalStacked).toBeGreaterThan(Z_INDEX.modal);
  });
});
