import { describe, it, expect } from "vitest";
import { getChangeTypeBadgeClass } from "./fileHistoryChangeTypeBadge";

describe("getChangeTypeBadgeClass", () => {
  it("returns the emerald class for 'added'", () => {
    expect(getChangeTypeBadgeClass("added")).toBe(
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    );
  });

  it("returns the rose class for 'deleted'", () => {
    expect(getChangeTypeBadgeClass("deleted")).toBe(
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
    );
  });

  it("falls back to the amber class for 'modified' or any other change type", () => {
    expect(getChangeTypeBadgeClass("modified")).toBe(
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    );
    expect(getChangeTypeBadgeClass("unknown")).toBe(
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    );
  });
});
