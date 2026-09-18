import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("hiển thị nội dung con", () => {
    render(<Button>Lưu lại</Button>);
    expect(screen.getByRole("button", { name: "Lưu lại" })).toBeInTheDocument();
  });

  it("gọi onClick khi bấm", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Bấm</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("bị vô hiệu hoá và không gọi onClick khi loading", () => {
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

  it("hiện spinner khi loading", () => {
    const { container } = render(<Button loading>Đang lưu</Button>);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("không hiện spinner khi không loading", () => {
    const { container } = render(<Button>Bình thường</Button>);
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("bị vô hiệu hoá khi truyền disabled", () => {
    render(<Button disabled>Không bấm được</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("variant khác nhau cho ra class khác nhau", () => {
    const { rerender, container } = render(<Button variant="primary">X</Button>);
    const primaryClass = container.querySelector("button")?.className;

    rerender(<Button variant="danger">X</Button>);
    const dangerClass = container.querySelector("button")?.className;

    expect(primaryClass).not.toBe(dangerClass);
  });

  it("mặc định type là button để không submit form ngoài ý muốn", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("cho phép ghi đè type thành submit", () => {
    render(<Button type="submit">Gửi</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
