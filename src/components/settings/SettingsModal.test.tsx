import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { SettingsModal } from "./SettingsModal";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("SettingsModal", () => {
  beforeEach(() => {
    useSettingsStore.getState().closeSettings();
    useSettingsStore.getState().setActiveTab("profile");
  });

  it("renders when isSettingsOpen is true and closes via close button", () => {
    useSettingsStore.getState().openSettings("profile");
    render(<SettingsModal currentRepoPath={null} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Cài đặt|Settings/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Đóng|Close/i);
    fireEvent.click(closeBtn);

    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });

  it("switches tabs when tab buttons are clicked", () => {
    useSettingsStore.getState().openSettings("profile");
    render(<SettingsModal currentRepoPath={null} />);

    // Find and click Appearance tab button
    const appearanceTabBtn = screen.getByText(/Giao diện & Hiển thị|Appearance & UX/i);
    fireEvent.click(appearanceTabBtn);

    expect(useSettingsStore.getState().activeTab).toBe("appearance");
  });

  it("switches to behavior tab", () => {
    useSettingsStore.getState().openSettings("profile");
    render(<SettingsModal currentRepoPath={null} />);

    const behaviorTabBtn = screen.getByText(/Hành vi Git|Git Behavior/i);
    fireEvent.click(behaviorTabBtn);

    expect(useSettingsStore.getState().activeTab).toBe("behavior");
  });

  it("maintains a stable 85% width and height container across tabs", () => {
    useSettingsStore.getState().openSettings("profile");
    render(<SettingsModal currentRepoPath={null} />);

    // Under the shared Modal the panel is the dialog's child and the sized
    // container sits inside it, so this reaches for the sized box by test id
    // rather than by position. The assertion itself is unchanged: the
    // settings dialog is sized against the viewport, not its content.
    const sizedBox = screen.getByTestId("modal-panel").firstElementChild;
    expect(sizedBox).toHaveClass("w-[85vw]");
    expect(sizedBox).toHaveClass("h-[85vh]");
  });
});
