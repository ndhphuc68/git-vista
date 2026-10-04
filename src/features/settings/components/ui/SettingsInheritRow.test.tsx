import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsInheritRow } from "./SettingsInheritRow";

describe("SettingsInheritRow", () => {
  it("reports turning inheritance off", () => {
    const onInheritChange = vi.fn();
    render(<SettingsInheritRow inheriting onInheritChange={onInheritChange} />);
    const sw = screen.getByTestId("toggle-use-global");
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    expect(onInheritChange).toHaveBeenCalledWith(false);
  });

  it("shows the reset button only when it can reset", () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <SettingsInheritRow inheriting={false} onInheritChange={() => {}} onReset={onReset} />
    );
    expect(screen.queryByTestId("reset-to-global-btn")).not.toBeInTheDocument();

    rerender(
      <SettingsInheritRow
        inheriting={false}
        onInheritChange={() => {}}
        canReset
        onReset={onReset}
      />
    );
    fireEvent.click(screen.getByTestId("reset-to-global-btn"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
