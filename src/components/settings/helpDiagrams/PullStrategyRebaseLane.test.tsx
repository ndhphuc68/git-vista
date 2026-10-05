import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PullStrategyRebaseLane } from "./PullStrategyRebaseLane";

describe("PullStrategyRebaseLane", () => {
  it("renders the four commit labels", () => {
    render(<PullStrategyRebaseLane />);

    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText("C2 (remote)")).toBeInTheDocument();
    expect(screen.getByText("C3'")).toBeInTheDocument();
    expect(screen.getByText("C4'")).toBeInTheDocument();
  });

  it("pulses exactly the two rebased commit circles", () => {
    const { container } = render(<PullStrategyRebaseLane />);

    expect(container.querySelectorAll("circle")).toHaveLength(4);
    expect(container.querySelectorAll("circle.animate-pulse")).toHaveLength(2);
  });
});
