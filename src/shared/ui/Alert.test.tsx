import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("hiển thị nội dung", () => {
    render(<Alert variant="error">Không xoá được nhánh</Alert>);
    expect(screen.getByText("Không xoá được nhánh")).toBeInTheDocument();
  });

  it("dùng role=alert cho lỗi để trình đọc màn hình thông báo ngay", () => {
    render(<Alert variant="error">Hỏng rồi</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("không dùng role=alert cho thông tin thường", () => {
    render(<Alert variant="info">Chỉ là thông tin</Alert>);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("variant khác nhau cho ra class khác nhau", () => {
    const { rerender, container } = render(<Alert variant="error">X</Alert>);
    const errorClass = container.firstElementChild?.className;

    rerender(<Alert variant="success">X</Alert>);
    const successClass = container.firstElementChild?.className;

    expect(errorClass).not.toBe(successClass);
  });

  it("hiện icon mặc định theo variant", () => {
    const { container } = render(<Alert variant="warning">X</Alert>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("ẩn được icon khi không cần", () => {
    const { container } = render(
      <Alert variant="info" showIcon={false}>
        X
      </Alert>
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
