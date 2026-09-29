import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PullStrategyDiagram } from "./PullStrategyDiagram";

describe("PullStrategyDiagram", () => {
  it("renders the rebase diagram by default and switches to the merge diagram on click", () => {
    render(<PullStrategyDiagram />);

    // Default mode is "rebase": shows the linear commit line and its caption.
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText(/Rebase: Giữ lịch sử commit gọn gàng/)).toBeInTheDocument();

    // Switch to "merge" mode via the toggle tab.
    fireEvent.click(screen.getByRole("button", { name: /Merge \(Rẽ nhánh\)/i }));

    expect(screen.getByText("Merge Commit")).toBeInTheDocument();
    expect(screen.getByText(/Merge: Giữ nguyên lịch sử rẽ nhánh/)).toBeInTheDocument();
  });
});
