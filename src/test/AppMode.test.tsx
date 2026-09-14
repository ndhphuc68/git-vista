import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";
import { ControlsBar } from "../components/ControlsBar";
import { CommitBox } from "../components/changes/CommitBox";

describe("Simple vs Advanced Mode", () => {
  beforeEach(() => {
    useSettingsStore.getState().setMode("simple");
  });

  it("ControlsBar toggles mode on click", () => {
    render(<ControlsBar lastEvent={null} />);

    const modeBtn = screen.getByRole("button", { name: /Simple|Đơn giản/i });
    expect(modeBtn).toHaveTextContent(/Simple|Đơn giản/i);

    fireEvent.click(modeBtn);
    expect(useSettingsStore.getState().mode).toBe("advanced");
    expect(modeBtn).toHaveTextContent(/Advanced|Nâng cao/i);
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
