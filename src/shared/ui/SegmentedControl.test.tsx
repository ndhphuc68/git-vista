import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";

const OPTIONS: SegmentedOption<number>[] = [
  { value: 0, label: "Off", testId: "opt-0" },
  { value: 50, label: "50", testId: "opt-50" },
  { value: 72, label: "72", testId: "opt-72", disabled: true },
  { value: 100, label: "100", testId: "opt-100" },
];

function Controlled({ onPicked }: { onPicked?: (v: number) => void }) {
  const [value, setValue] = useState(0);
  return (
    <SegmentedControl
      aria-label="Limit"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        setValue(next);
        onPicked?.(next);
      }}
    />
  );
}

describe("SegmentedControl", () => {
  it("renders a radiogroup with the selected radio checked", () => {
    render(<Controlled />);
    expect(screen.getByRole("radiogroup", { name: "Limit" })).toBeInTheDocument();
    expect(screen.getByTestId("opt-0")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("opt-50")).toHaveAttribute("aria-checked", "false");
  });

  it("selects an option on click", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);
    fireEvent.click(screen.getByTestId("opt-50"));
    expect(onPicked).toHaveBeenCalledWith(50);
    expect(screen.getByTestId("opt-50")).toHaveAttribute("aria-checked", "true");
  });

  it("only the selected radio is in the tab order", () => {
    render(<Controlled />);
    expect(screen.getByTestId("opt-0")).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("opt-50")).toHaveAttribute("tabindex", "-1");
  });

  it("moves with arrow keys, skipping disabled options and wrapping", () => {
    const onPicked = vi.fn();
    render(<Controlled onPicked={onPicked} />);
    fireEvent.keyDown(screen.getByTestId("opt-0"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(50);
    fireEvent.keyDown(screen.getByTestId("opt-50"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(100);
    fireEvent.keyDown(screen.getByTestId("opt-100"), { key: "ArrowRight" });
    expect(onPicked).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(screen.getByTestId("opt-0"), { key: "ArrowLeft" });
    expect(onPicked).toHaveBeenLastCalledWith(100);
    expect(screen.getByTestId("opt-100")).toHaveFocus();
  });

  it("disables every option when disabled", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl aria-label="L" value={0} options={OPTIONS} onChange={onChange} disabled />
    );
    fireEvent.click(screen.getByTestId("opt-50"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("opt-50")).toBeDisabled();
  });
});
