import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("exposes switch role and checked state", () => {
    render(<Switch checked aria-label="Line numbers" onChange={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Line numbers" });
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("reports the toggled value on click", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} aria-label="Prune" onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not report changes while disabled", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} disabled aria-label="Prune" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards id and data-testid", () => {
    render(<Switch checked={false} id="gpg" data-testid="toggle-gpg" onChange={() => {}} />);
    expect(screen.getByTestId("toggle-gpg")).toHaveAttribute("id", "gpg");
  });

  it("is a non-submitting button", () => {
    render(<Switch checked={false} aria-label="X" onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("type", "button");
  });
});
