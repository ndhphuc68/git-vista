import { describe, it, expect } from "vitest";
import { getPlacementClass } from "./helpTooltipPlacement";

describe("getPlacementClass", () => {
  it("maps bottom-left", () => {
    expect(getPlacementClass("bottom-left")).toBe("top-full left-0 mt-2");
  });

  it("maps bottom-right", () => {
    expect(getPlacementClass("bottom-right")).toBe("top-full right-0 mt-2");
  });

  it("maps top-left", () => {
    expect(getPlacementClass("top-left")).toBe("bottom-full left-0 mb-2");
  });

  it("maps top-right", () => {
    expect(getPlacementClass("top-right")).toBe("bottom-full right-0 mb-2");
  });

  it("falls back to bottom-left for an unknown value", () => {
    // Mirrors the original switch's `default:` fallthrough for any
    // unrecognized placement.
    expect(getPlacementClass("unknown" as never)).toBe("top-full left-0 mt-2");
  });
});
