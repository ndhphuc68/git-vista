import { describe, it, expect } from "vitest";
import {
  filterGroups,
  findOption,
  navigableOptions,
  normalizeGroups,
  stepIndex,
} from "./selectOptions";

const flat = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta", disabled: true },
  { value: "c", label: "Gamma" },
];

const grouped = [
  { label: "Local", options: [{ value: "refs/heads/main", label: "main" }] },
  { label: "Remote", options: [{ value: "refs/remotes/origin/dev", label: "origin/dev" }] },
];

describe("normalizeGroups", () => {
  it("wraps a flat list in one unlabelled group", () => {
    expect(normalizeGroups(flat)).toEqual([{ label: null, options: flat }]);
  });

  it("keeps labelled groups", () => {
    expect(normalizeGroups(grouped).map((g) => g.label)).toEqual(["Local", "Remote"]);
  });

  it("returns no groups for an empty list", () => {
    expect(normalizeGroups([])).toEqual([]);
  });
});

describe("filterGroups", () => {
  it("matches labels case-insensitively and drops empty groups", () => {
    const result = filterGroups(normalizeGroups(grouped), "  DEV ");
    expect(result).toEqual([{ label: "Remote", options: grouped[1]!.options }]);
  });

  it("returns the groups untouched for a blank query", () => {
    const groups = normalizeGroups(grouped);
    expect(filterGroups(groups, "   ")).toBe(groups);
  });
});

describe("navigableOptions", () => {
  it("skips disabled options", () => {
    expect(navigableOptions(normalizeGroups(flat)).map((o) => o.value)).toEqual(["a", "c"]);
  });
});

describe("findOption", () => {
  it("finds an option across groups", () => {
    expect(findOption(normalizeGroups(grouped), "refs/remotes/origin/dev")?.label).toBe(
      "origin/dev"
    );
    expect(findOption(normalizeGroups(grouped), "missing")).toBeUndefined();
  });
});

describe("stepIndex", () => {
  it("starts at the first or last option when nothing is active", () => {
    expect(stepIndex(3, -1, 1)).toBe(0);
    expect(stepIndex(3, -1, -1)).toBe(2);
  });

  it("clamps to the ends of the list", () => {
    expect(stepIndex(3, 2, 1)).toBe(2);
    expect(stepIndex(3, 0, -1)).toBe(0);
    expect(stepIndex(3, 1, 1)).toBe(2);
  });

  it("returns -1 for an empty list", () => {
    expect(stepIndex(0, -1, 1)).toBe(-1);
  });
});
