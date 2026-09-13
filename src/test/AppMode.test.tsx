import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { Titlebar } from "../components/Titlebar";
import { CommitBox } from "../components/changes/CommitBox";

describe("Simple vs Advanced Mode", () => {
  beforeEach(() => {
    useSettingsStore.getState().setMode("simple");
  });

  it("Titlebar toggles mode on click", () => {
    render(<Titlebar />);

    const modeBtn = screen.getByRole("button", { name: /Chế độ|Mode/i });
    expect(modeBtn).toHaveTextContent(/Đơn giản/i);

    fireEvent.click(modeBtn);
    expect(useSettingsStore.getState().mode).toBe("advanced");
    expect(modeBtn).toHaveTextContent(/Advanced/i);
  });

  it("CommitBox adapts button and checkbox text according to mode", () => {
    const { rerender } = render(
      <CommitBox repoPath="/test/repo" stagedCount={1} onCommit={vi.fn()} />
    );

    // In simple mode
    expect(screen.getByText(/Lưu thay đổi/i)).toBeInTheDocument();
    expect(screen.getByText(/Sửa commit vừa tạo/i)).toBeInTheDocument();

    // Switch to advanced mode
    useSettingsStore.getState().setMode("advanced");
    rerender(
      <CommitBox repoPath="/test/repo" stagedCount={1} onCommit={vi.fn()} />
    );

    expect(screen.getByText(/Commit \(1 files\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Amend \(Sửa commit gần nhất\)/i)).toBeInTheDocument();
  });
});
