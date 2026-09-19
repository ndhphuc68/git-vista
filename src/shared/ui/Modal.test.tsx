import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Z_INDEX } from "../../domain/constants/zIndex";
import { MODAL_SIZE } from "../../domain/constants/ui";

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Modal isOpen onClose={onClose} labelledBy="test-title" {...props}>
      <Modal.Header title="Test title" onClose={onClose} titleId="test-title" />
      <Modal.Body>
        <p>Modal body content</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
  return { ...utils, onClose };
}

describe("Modal", () => {
  it("renders its content when open", () => {
    renderModal();
    expect(screen.getByText("Modal body content")).toBeInTheDocument();
    expect(screen.getByText("Test title")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Modal body content")).not.toBeInTheDocument();
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

  // For dialogs whose title lives inside a child component with no id to
  // point at (the compare dialog), so labelledBy is not usable.
  it("names the dialog with aria-label when given one instead of labelledBy", () => {
    render(
      <Modal isOpen onClose={vi.fn()} label="So sánh">
        <Modal.Body>X</Modal.Body>
      </Modal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "So sánh");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
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

    fireEvent.click(screen.getByText("Modal body content"));

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

  // Added for the settings and compare dialogs, which are sized against the
  // viewport rather than a content width. Without a tier for them they would
  // be clamped by max-w-5xl and render narrower than they did before.
  it("the full size tier is not clamped by a fixed max width", () => {
    renderModal({ size: "full" });

    const panel = screen.getByTestId("modal-panel");
    expect(panel.className).toContain(MODAL_SIZE.full);
    expect(panel.className).not.toMatch(/max-w-(sm|md|2xl|5xl)\b/);
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

  describe("focus management", () => {
    let opener: HTMLButtonElement;

    beforeEach(() => {
      opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();
    });

    afterEach(() => {
      opener.remove();
    });

    it("moves focus into the panel when opened", () => {
      renderModal();

      expect(screen.getByTestId("modal-panel").contains(document.activeElement)).toBe(
        true
      );
    });

    it("keeps Tab inside the panel instead of reaching the page behind it", () => {
      renderModal();
      const panel = screen.getByTestId("modal-panel");
      const cancel = screen.getByText("Cancel");
      act(() => cancel.focus());

      fireEvent.keyDown(cancel, { key: "Tab" });

      expect(panel.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(opener);
    });

    it("returns focus to the element that opened it once closed", () => {
      const { rerender, onClose } = renderModal();
      expect(document.activeElement).not.toBe(opener);

      rerender(
        <Modal isOpen={false} onClose={onClose} labelledBy="test-title">
          <Modal.Body>X</Modal.Body>
        </Modal>
      );

      expect(document.activeElement).toBe(opener);
    });

    it("does not touch focus while closed", () => {
      renderModal({ isOpen: false });

      expect(document.activeElement).toBe(opener);
    });
  });
});
