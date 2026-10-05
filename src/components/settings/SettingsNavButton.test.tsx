import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsNavButton } from "./SettingsNavButton";
import type { NavItem } from "./settingsModalState.helpers";

describe("SettingsNavButton", () => {
  const mockItem: NavItem = {
    id: "github",
    label: "GitHub",
    icon: <span data-testid="github-icon">icon</span>,
  };

  it("renders label and icon correctly", () => {
    render(<SettingsNavButton item={mockItem} active={false} onSelect={vi.fn()} />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByTestId("github-icon")).toBeInTheDocument();
  });

  it("applies inactive styling when active is false", () => {
    render(<SettingsNavButton item={mockItem} active={false} onSelect={vi.fn()} />);

    const button = screen.getByRole("button", { name: /github/i });
    expect(button).not.toHaveAttribute("aria-current");
    expect(button.className).toContain("text-secondary");
    expect(button.className).not.toContain("bg-accent-subtle");
  });

  it("applies active pill styling and aria-current when active is true", () => {
    render(<SettingsNavButton item={mockItem} active={true} onSelect={vi.fn()} />);

    const button = screen.getByRole("button", { name: /github/i });
    expect(button).toHaveAttribute("aria-current", "page");
    expect(button.className).toContain("bg-accent-subtle");
    expect(button.className).toContain("text-primary");
    expect(button.className).toContain("border-accent/20");

    const iconWrapper = screen.getByTestId("github-icon").parentElement;
    expect(iconWrapper?.className).toContain("text-link");
  });

  it("triggers onSelect callback with item.id on click", () => {
    const handleSelect = vi.fn();
    render(<SettingsNavButton item={mockItem} active={false} onSelect={handleSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /github/i }));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("github");
  });
});
