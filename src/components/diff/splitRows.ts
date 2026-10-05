import { type DiffLine } from "../../ipc/bindings.generated";

/** One side of a split row; `index` is the line's position in the hunk (for word-diff tokens). */
export interface SplitSide {
  line: DiffLine;
  index: number;
}

export interface SplitRow {
  left: SplitSide | null;
  right: SplitSide | null;
}

/** Collects consecutive lines of `lineType` starting at `start`. */
function takeRun(lines: DiffLine[], start: number, lineType: string): SplitSide[] {
  const run: SplitSide[] = [];
  for (let i = start; i < lines.length && lines[i]!.line_type === lineType; i++) {
    run.push({ line: lines[i]!, index: i });
  }
  return run;
}

/**
 * Lays a hunk out as side-by-side rows. Context lines appear on both sides; a
 * run of deletes followed by a run of adds is paired in order, and the shorter
 * side gets empty cells.
 */
export function pairSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.line_type !== "delete" && line.line_type !== "add") {
      rows.push({ left: { line, index: i }, right: { line, index: i } });
      i++;
      continue;
    }
    const deletes = takeRun(lines, i, "delete");
    const adds = takeRun(lines, i + deletes.length, "add");
    const count = Math.max(deletes.length, adds.length);
    for (let k = 0; k < count; k++) {
      rows.push({ left: deletes[k] ?? null, right: adds[k] ?? null });
    }
    i += deletes.length + adds.length;
  }
  return rows;
}
