import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { CommandPalette } from "../components/palette/CommandPalette";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";
import { CommandContext } from "../utils/commandRegistry";

describe("CommandPalette Component", () => {
  const mockNavigate = vi.fn();
  const mockCreateBranch = vi.fn();
  const mockShortcuts = vi.fn();
  const mockToggleTheme = vi.fn();
  const mockToggleMode = vi.fn();

  const dummyContext: CommandContext = {
    repoPath: "/test/repo",
    navigate: mockNavigate,
    openCreateBranch: mockCreateBranch,
    openShortcutsHelp: mockShortcuts,
    toggleTheme: mockToggleTheme,
    toggleMode: mockToggleMode,
  };

  beforeEach(() => {
    useCommandPaletteStore.getState().close();
    vi.clearAllMocks();
  });

  it("does not render when store.isOpen is false", () => {
    render(<CommandPalette context={dummyContext} />);
    expect(screen.queryByPlaceholderText(/Tìm kiếm lệnh/i)).not.toBeInTheDocument();
  });

  it("renders when store.isOpen is true and displays command items", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    expect(screen.getByPlaceholderText(/Tìm kiếm lệnh/i)).toBeInTheDocument();
    expect(screen.getByText(/Chuyển sang Lịch sử/i)).toBeInTheDocument();
  });

  it("navigates with ArrowDown/ArrowUp and triggers action on Enter", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    const input = screen.getByPlaceholderText(/Tìm kiếm lệnh/i);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
  });

  it("filters commands based on search input", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    const input = screen.getByPlaceholderText(/Tìm kiếm lệnh/i);
    fireEvent.change(input, { target: { value: "theme" } });

    expect(screen.getByText(/Đổi giao diện Sáng/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chuyển sang Lịch sử/i)).not.toBeInTheDocument();
  });

  it("closes on Escape key or backdrop click", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    const input = screen.getByPlaceholderText(/Tìm kiếm lệnh/i);
    fireEvent.keyDown(input, { key: "Escape" });

    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
  });

  it("closes on backdrop click", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    const backdrop = screen.getByRole("dialog");
    fireEvent.click(backdrop);

    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
  });

  it("executes command action on click", () => {
    useCommandPaletteStore.getState().open();
    render(<CommandPalette context={dummyContext} />);

    const historyItem = screen.getByText(/Chuyển sang Lịch sử/i);
    fireEvent.click(historyItem);

    expect(mockNavigate).toHaveBeenCalledWith("history");
    expect(useCommandPaletteStore.getState().isOpen).toBe(false);
  });
});
