import { describe, it, expect } from "vitest";
import { pairSplitRows } from "./splitRows";
import type { DiffLine } from "../../ipc/bindings.generated";

const ctx = (n: number): DiffLine => ({
  line_type: "context",
  content: `c${n}`,
  old_lineno: n,
  new_lineno: n,
});
const del = (n: number): DiffLine => ({
  line_type: "delete",
  content: `d${n}`,
  old_lineno: n,
  new_lineno: null,
});
const add = (n: number): DiffLine => ({
  line_type: "add",
  content: `a${n}`,
  old_lineno: null,
  new_lineno: n,
});

function shape(lines: DiffLine[]) {
  return pairSplitRows(lines).map((row) => [
    row.left?.line.content ?? null,
    row.right?.line.content ?? null,
  ]);
}

describe("pairSplitRows", () => {
  it("puts context lines on both sides", () => {
    expect(shape([ctx(1), ctx(2)])).toEqual([
      ["c1", "c1"],
      ["c2", "c2"],
    ]);
  });

  it("pads the right side when deletes outnumber adds", () => {
    expect(shape([del(1), del(2), add(1)])).toEqual([
      ["d1", "a1"],
      ["d2", null],
    ]);
  });

  it("pads the left side when adds outnumber deletes", () => {
    expect(shape([del(1), add(1), add(2)])).toEqual([
      ["d1", "a1"],
      [null, "a2"],
    ]);
  });

  it("keeps lone adds and alternating runs separate", () => {
    expect(shape([add(1), ctx(2), del(3), add(3), ctx(4)])).toEqual([
      [null, "a1"],
      ["c2", "c2"],
      ["d3", "a3"],
      ["c4", "c4"],
    ]);
  });

  it("keeps each line's index in the hunk", () => {
    const rows = pairSplitRows([ctx(1), del(2), add(2)]);
    expect(rows[1]?.left?.index).toBe(1);
    expect(rows[1]?.right?.index).toBe(2);
  });
});
