import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GraphSvgLane } from "./GraphSvgLane";
import type { GraphEdge } from "../../ipc/bindings.generated";

const straightEdge: GraphEdge = { from_col: 0, to_col: 0, edge_type: "straight", color_index: 0 };
const mergeEdge: GraphEdge = { from_col: 1, to_col: 0, edge_type: "merge", color_index: 1 };
const forkEdge: GraphEdge = { from_col: 0, to_col: 2, edge_type: "fork", color_index: 2 };

describe("GraphSvgLane", () => {
  it("renders a straight line at the exact lane coordinates", () => {
    const { container } = render(
      <GraphSvgLane col={0} colorIndex={0} lines={[straightEdge]} isHead={false} isMerge={false} />
    );

    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line?.getAttribute("x1")).toBe("8");
    expect(line?.getAttribute("x2")).toBe("8");
    expect(line?.getAttribute("y1")).toBe("0");
    expect(line?.getAttribute("y2")).toBe("32");
    expect(line?.getAttribute("stroke")).toBe("#2F6FEB");
  });

  it("renders merge and fork edges as curved paths with the edge's own color", () => {
    const { container } = render(
      <GraphSvgLane
        col={0}
        colorIndex={0}
        lines={[mergeEdge, forkEdge]}
        isHead={false}
        isMerge={false}
      />
    );

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
    expect(paths[0]?.getAttribute("d")).toBe("M 24 0 C 24 12, 8 12, 8 16");
    expect(paths[0]?.getAttribute("stroke")).toBe("#8E44AD");
    expect(paths[1]?.getAttribute("d")).toBe("M 8 16 C 8 24, 40 24, 40 32");
    expect(paths[1]?.getAttribute("stroke")).toBe("#27AE60");
  });

  it("renders the HEAD node marker with four concentric circles", () => {
    const { container } = render(
      <GraphSvgLane col={1} colorIndex={2} lines={[]} isHead={true} isMerge={false} />
    );

    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(4);
    expect(circles[0]?.getAttribute("cx")).toBe("24");
    expect(circles[0]?.getAttribute("cy")).toBe("16");
    expect(circles[0]?.getAttribute("r")).toBe("8");
  });

  it("renders the merge node marker with three concentric circles", () => {
    const { container } = render(
      <GraphSvgLane col={0} colorIndex={0} lines={[]} isHead={false} isMerge={true} />
    );
    expect(container.querySelectorAll("circle").length).toBe(3);
  });

  it("renders a regular commit node with two concentric circles", () => {
    const { container } = render(
      <GraphSvgLane col={0} colorIndex={0} lines={[]} isHead={false} isMerge={false} />
    );
    expect(container.querySelectorAll("circle").length).toBe(2);
  });
});
