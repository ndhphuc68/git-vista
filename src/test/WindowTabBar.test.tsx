import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WindowTabBar } from "../components/header/WindowTabBar";
import { useTabStore } from "../store/useTabStore";

describe("WindowTabBar", () => {
  beforeEach(() => {
    useTabStore.getState().reset();
  });

  it("renders Home tab by default", () => {
    render(<WindowTabBar onSelectFolder={vi.fn()} />);
    expect(screen.getByTestId("tab-home")).toBeInTheDocument();
  });

  it("renders opened repo tabs with title, branch, and close button", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar onSelectFolder={vi.fn()} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByTestId("close-tab-d:/projects/alpha")).toBeInTheDocument();
  });

  it("switches active tab on click", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar onSelectFolder={vi.fn()} />);
    fireEvent.click(screen.getByTestId("tab-home"));
    expect(useTabStore.getState().activeTabId).toBe("home");
  });

  it("closes tab when close button is clicked", () => {
    useTabStore.getState().openRepoTab({
      path: "d:/projects/alpha",
      name: "alpha",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "123",
    });

    render(<WindowTabBar onSelectFolder={vi.fn()} />);
    fireEvent.click(screen.getByTestId("close-tab-d:/projects/alpha"));
    expect(useTabStore.getState().tabs.some((t) => t.id === "d:/projects/alpha")).toBe(false);
  });

  it("calls onSelectFolder when new tab button is clicked", () => {
    const handleSelectFolder = vi.fn();
    render(<WindowTabBar onSelectFolder={handleSelectFolder} />);
    fireEvent.click(screen.getByTestId("btn-new-tab"));
    expect(handleSelectFolder).toHaveBeenCalled();
  });
});
