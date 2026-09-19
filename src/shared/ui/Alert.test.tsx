import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders its content", () => {
    render(<Alert variant="error">Không xoá được nhánh</Alert>);
    expect(screen.getByText("Không xoá được nhánh")).toBeInTheDocument();
  });

  it("uses role=alert for errors so screen readers announce immediately", () => {
    render(<Alert variant="error">Hỏng rồi</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("does not use role=alert for regular information", () => {
    const variants: Array<"warning" | "info" | "success"> = [
      "warning",
      "info",
      "success",
    ];
    variants.forEach((variant) => {
      const { unmount } = render(<Alert variant={variant}>Thông tin</Alert>);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      unmount();
    });
  });

  it("different variants produce different classes", () => {
    const { rerender, container } = render(<Alert variant="error">X</Alert>);
    const errorClass = container.firstElementChild?.className;

    rerender(<Alert variant="success">X</Alert>);
    const successClass = container.firstElementChild?.className;

    expect(errorClass).not.toBe(successClass);
  });

  it("shows the default icon for the variant", () => {
    const { container } = render(<Alert variant="warning">X</Alert>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("can hide the icon when not needed", () => {
    const { container } = render(
      <Alert variant="info" showIcon={false}>
        X
      </Alert>
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("marks the icon aria-hidden so screen readers don't announce it", () => {
    const { container } = render(<Alert variant="warning">X</Alert>);
    // SVG icon element must have aria-hidden to prevent screen reader noise
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
