import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HelpTooltip } from "./HelpTooltip";

describe("HelpTooltip Component", () => {
  it("renders trigger button with accessible label", () => {
    render(
      <HelpTooltip
        title="Chiến lược Git Pull"
        description="Giải thích chi tiết về Merge và Rebase"
      />
    );

    const trigger = screen.getByRole("button", { name: /Trợ giúp: Chiến lược Git Pull/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens popover on mouse enter and closes on mouse leave", async () => {
    render(
      <HelpTooltip
        title="Chiến lược Git Pull"
        description="Giải thích chi tiết về Merge và Rebase"
      />
    );

    const trigger = screen.getByRole("button", { name: /Trợ giúp: Chiến lược Git Pull/i });

    fireEvent.mouseEnter(trigger);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByText("Giải thích chi tiết về Merge và Rebase")).toBeInTheDocument();
    });

    fireEvent.mouseLeave(trigger);

    await waitFor(
      () => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("can toggle open/close via click", async () => {
    render(
      <HelpTooltip
        title="Dọn dẹp Fetch Prune"
        description="Tự động dọn dẹp các nhánh remote đã xóa"
      />
    );

    const trigger = screen.getByRole("button", { name: /Trợ giúp: Dọn dẹp Fetch Prune/i });

    // Click to open
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    // Click again to close
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("closes on Escape key press", async () => {
    render(
      <HelpTooltip title="Autostash Rebase" description="Tự động cất trữ thay đổi khi rebase" />
    );

    const trigger = screen.getByRole("button", { name: /Trợ giúp: Autostash Rebase/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("renders diagram content when diagram prop is supplied", async () => {
    render(
      <HelpTooltip
        title="Diff Side-by-side"
        description="So sánh 2 cột trực quan"
        diagram={<div data-testid="custom-diff-diagram">Animated Diagram</div>}
      />
    );

    const trigger = screen.getByRole("button", { name: /Trợ giúp: Diff Side-by-side/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId("custom-diff-diagram")).toBeInTheDocument();
      expect(screen.getByText("Animated Diagram")).toBeInTheDocument();
    });
  });
});
