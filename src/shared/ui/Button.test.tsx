import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not call onClick while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Đang lưu
      </Button>
    );

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows a spinner while loading", () => {
    const { container } = render(<Button loading>Đang lưu</Button>);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not show a spinner when not loading", () => {
    const { container } = render(<Button>Bình thường</Button>);
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("is disabled when passed disabled", () => {
    render(<Button disabled>Cannot click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("different variants produce different classes", () => {
    const { rerender, container } = render(<Button variant="primary">X</Button>);
    const primaryClass = container.querySelector("button")?.className;

    rerender(<Button variant="danger">X</Button>);
    const dangerClass = container.querySelector("button")?.className;

    expect(primaryClass).not.toBe(dangerClass);
  });

  it("defaults type to button so it doesn't accidentally submit a form", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("allows overriding type to submit", () => {
    render(<Button type="submit">Gửi</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
