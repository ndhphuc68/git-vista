import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownSearchInput } from "./DropdownSearchInput";

describe("DropdownSearchInput", () => {
  it("renders with placeholder and autofocus attribute", () => {
    render(<DropdownSearchInput value="" onChange={vi.fn()} placeholder="Filter branches..." />);

    const input = screen.getByPlaceholderText("Filter branches...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("data-autofocus");
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<DropdownSearchInput value="" onChange={onChange} placeholder="Filter branches..." />);

    const input = screen.getByPlaceholderText("Filter branches...");
    fireEvent.change(input, { target: { value: "feature" } });

    expect(onChange).toHaveBeenCalledWith("feature");
  });

  it("displays clear button when value is present and clears on click", () => {
    const onChange = vi.fn();
    render(
      <DropdownSearchInput
        value="test-query"
        onChange={onChange}
        placeholder="Filter branches..."
      />
    );

    const clearBtn = screen.getByLabelText("Clear search");
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("clears on Escape key press", () => {
    const onChange = vi.fn();
    render(
      <DropdownSearchInput
        value="test-query"
        onChange={onChange}
        placeholder="Filter branches..."
      />
    );

    const input = screen.getByPlaceholderText("Filter branches...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).toHaveBeenCalledWith("");
  });
});
