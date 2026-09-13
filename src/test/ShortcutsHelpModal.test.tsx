import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ShortcutsHelpModal } from "../components/shortcuts/ShortcutsHelpModal";

describe("ShortcutsHelpModal Component", () => {
  it("does not render when isOpen is false", () => {
    render(<ShortcutsHelpModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Bảng phím tắt/i)).not.toBeInTheDocument();
  });

  it("renders shortcut groups when isOpen is true", () => {
    render(<ShortcutsHelpModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Bảng phím tắt/i)).toBeInTheDocument();
    expect(screen.getByText(/Command Palette/i)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\+K/i)).toBeInTheDocument();
    expect(screen.getByText(/Tạo nhánh mới/i)).toBeInTheDocument();
  });

  it("triggers onClose when clicking close button or pressing Escape", () => {
    const handleClose = vi.fn();
    render(<ShortcutsHelpModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /Đóng/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
