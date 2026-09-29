import { describe, it, expect } from "vitest";
import { isClickOutsideTooltip } from "./helpTooltipDismissal";

function makeRef<T>(el: T | null): { current: T | null } {
  return { current: el };
}

describe("isClickOutsideTooltip", () => {
  it("is false when the target is inside the trigger", () => {
    const trigger = document.createElement("button");
    const child = document.createElement("span");
    trigger.appendChild(child);
    const popover = document.createElement("div");

    expect(isClickOutsideTooltip(child, makeRef(trigger), makeRef(popover))).toBe(false);
  });

  it("is false when the target is inside the popover", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    const child = document.createElement("span");
    popover.appendChild(child);

    expect(isClickOutsideTooltip(child, makeRef(trigger), makeRef(popover))).toBe(false);
  });

  it("is true when the target is outside both the trigger and the popover", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    const outside = document.createElement("span");

    expect(isClickOutsideTooltip(outside, makeRef(trigger), makeRef(popover))).toBe(true);
  });

  it("is false when the trigger ref is null", () => {
    const popover = document.createElement("div");
    const outside = document.createElement("span");

    expect(isClickOutsideTooltip(outside, makeRef(null), makeRef(popover))).toBe(false);
  });

  it("is false when the popover ref is null", () => {
    const trigger = document.createElement("button");
    const outside = document.createElement("span");

    expect(isClickOutsideTooltip(outside, makeRef(trigger), makeRef(null))).toBe(false);
  });
});
