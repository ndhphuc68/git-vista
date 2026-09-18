import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";
import { Button } from "./Button";

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
  it("hiển thị nội dung khi mở", () => {
    renderModal();
    expect(screen.getByText("Nội dung thân modal")).toBeInTheDocument();
    expect(screen.getByText("Tiêu đề thử")).toBeInTheDocument();
  });

  it("không hiển thị gì khi đóng", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Nội dung thân modal")).not.toBeInTheDocument();
  });

  it("có role=dialog và aria-modal cho trợ năng", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("liên kết tiêu đề qua aria-labelledby", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "test-title");
  });

  it("gọi onClose khi bấm Escape", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gọi onClose khi bấm ra ngoài vùng nội dung", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("KHÔNG đóng khi bấm bên trong vùng nội dung", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByText("Nội dung thân modal"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("gọi onClose khi bấm nút X trên header", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("không bắt Escape khi modal đang đóng", () => {
    const { onClose } = renderModal({ isOpen: false });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("không đóng khi bấm Escape lúc closeOnEscape=false", () => {
    const { onClose } = renderModal({ closeOnEscape: false });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("không đóng khi bấm ra ngoài lúc closeOnBackdrop=false", () => {
    const { onClose } = renderModal({ closeOnBackdrop: false });

    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("size khác nhau cho ra class chiều rộng khác nhau", () => {
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
});
