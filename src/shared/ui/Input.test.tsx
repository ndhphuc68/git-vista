import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Checkbox } from "./Checkbox";

describe("Input", () => {
  it("defaults to a text input and forwards value changes", () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" value="" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("type", "text");

    fireEvent.change(input, { target: { value: "main" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("keeps an explicit type", () => {
    render(<Input aria-label="Token" type="password" />);
    expect(screen.getByLabelText("Token")).toHaveAttribute("type", "password");
  });

  it("marks itself invalid only when asked", () => {
    const { rerender } = render(<Input aria-label="Name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");

    rerender(<Input aria-label="Name" invalid />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-diff-remove-text");
  });

  it("applies size, mono and layout classes", () => {
    render(<Input aria-label="Url" size="md" mono className="pl-7" />);
    const input = screen.getByLabelText("Url");
    expect(input).toHaveClass("py-2", "font-mono", "pl-7");
  });

  it("forwards its ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText("Name"));
  });
});

describe("Textarea", () => {
  it("renders a textbox and forwards its ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Message" ref={ref} rows={3} />);

    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(ref.current).toBe(textarea);
  });

  it("marks itself invalid when asked", () => {
    render(<Textarea aria-label="Message" invalid />);
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Checkbox", () => {
  it("renders a checkbox and reports toggles", () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Force" checked={false} onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Force" });
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(<Checkbox aria-label="Force" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
