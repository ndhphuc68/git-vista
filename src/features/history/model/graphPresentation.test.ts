import { describe, expect, it } from "vitest";
import type { GraphCommitNode } from "../../../ipc/bindings.generated";
import { getBranchPillStyle, getMaxGraphColumns } from "./graphPresentation";

function commit(overrides: Partial<GraphCommitNode> = {}): GraphCommitNode {
  return {
    id: "commit-1",
    short_id: "commit-",
    summary: "Initial commit",
    author_name: "Test Author",
    author_email: "test@example.com",
    timestamp_sec: 0,
    parent_ids: [],
    col: 0,
    color_index: 0,
    lines: [],
    refs: [],
    ...overrides,
  };
}

describe("branch pill presentation", () => {
  it("gives HEAD precedence over tags", () => {
    expect(getBranchPillStyle("main", true, true)).toEqual({
      container: "bg-accent text-accent-contrast border-accent font-bold",
      dot: "bg-white",
      isHead: true,
    });
  });

  it("styles tags independently of their name", () => {
    for (const name of ["v1.0", "release"]) {
      expect(getBranchPillStyle(name, false, true)).toEqual({
        container:
          "bg-amber-100/85 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 font-semibold",
        dot: "bg-amber-500",
        isHead: false,
      });
    }
  });

  it.each([
    ["", "blue"],
    ["a", "purple"],
    ["b", "emerald"],
    ["c", "amber"],
    ["d", "rose"],
    ["e", "teal"],
    ["f", "indigo"],
    ["g", "orange"],
    ["main", "purple"],
    ["zzzzzz", "blue"],
  ])("keeps deterministic palette selection for %s", (name, color) => {
    const style = getBranchPillStyle(name, false, false);
    expect(style.dot).toBe(`bg-${color}-500`);
    expect(style.container).toContain(`bg-${color}-50/95`);
    expect(style.isHead).toBe(false);
  });
});

describe("maximum graph columns", () => {
  it("reserves at least three columns for empty and single-lane graphs", () => {
    expect(getMaxGraphColumns([])).toBe(3);
    expect(getMaxGraphColumns([commit()])).toBe(3);
  });

  it("includes commit columns with two columns of padding", () => {
    expect(getMaxGraphColumns([commit({ col: 7 }), commit({ col: 1 })])).toBe(9);
  });

  it.each([
    [{ from_col: 8, to_col: 1 }, 10],
    [{ from_col: 1, to_col: 9 }, 11],
  ])("includes both endpoints of graph lines: %o", (line, expected) => {
    expect(
      getMaxGraphColumns([commit({ lines: [{ ...line, edge_type: "merge", color_index: 0 }] })])
    ).toBe(expected);
  });
});
