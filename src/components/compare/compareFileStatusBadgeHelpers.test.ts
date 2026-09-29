import { describe, it, expect } from "vitest";
import { getFileStatusBadge } from "./compareFileStatusBadgeHelpers";

describe("getFileStatusBadge", () => {
  it("maps 'added' and 'new' to the Added badge", () => {
    expect(getFileStatusBadge("Added")).toEqual({
      letter: "A",
      className: "bg-diff-add-bg text-diff-add-text border border-diff-add-border",
      title: "Added",
    });
    expect(getFileStatusBadge("new")).toMatchObject({ letter: "A", title: "Added" });
  });

  it("maps 'deleted' to the Deleted badge", () => {
    expect(getFileStatusBadge("Deleted")).toEqual({
      letter: "D",
      className: "bg-diff-remove-bg text-diff-remove-text border border-diff-remove-border",
      title: "Deleted",
    });
  });

  it("maps 'renamed' to the Renamed badge", () => {
    expect(getFileStatusBadge("Renamed")).toEqual({
      letter: "R",
      className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      title: "Renamed",
    });
  });

  it("falls back to the Modified badge for any other status", () => {
    expect(getFileStatusBadge("Modified")).toEqual({
      letter: "M",
      className: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30",
      title: "Modified",
    });
    expect(getFileStatusBadge("unknown")).toMatchObject({ letter: "M", title: "Modified" });
  });
});
