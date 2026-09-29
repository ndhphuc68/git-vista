import { describe, it, expect } from "vitest";
import { getRebaseActionColor } from "../components/rebase/rebaseActionColor";

describe("getRebaseActionColor", () => {
  it("returns the neutral style when not selected, regardless of action", () => {
    expect(getRebaseActionColor("Pick", false)).toContain("text-secondary");
    expect(getRebaseActionColor("Drop", false)).toContain("text-secondary");
  });

  it("returns an action-specific highlighted style when selected", () => {
    expect(getRebaseActionColor("Pick", true)).toContain("emerald");
    expect(getRebaseActionColor("Reword", true)).toContain("sky");
    expect(getRebaseActionColor("Squash", true)).toContain("amber");
    expect(getRebaseActionColor("Fixup", true)).toContain("purple");
    expect(getRebaseActionColor("Drop", true)).toContain("rose");
  });
});
