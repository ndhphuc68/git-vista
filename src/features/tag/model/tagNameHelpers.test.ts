import { describe, it, expect } from "vitest";
import { sanitizeTagName } from "./tagNameHelpers";

describe("sanitizeTagName", () => {
  it("replaces spaces with a dash", () => {
    expect(sanitizeTagName("v1.0 release")).toBe("v1.0-release");
  });

  it("collapses runs of whitespace into a single dash", () => {
    expect(sanitizeTagName("v1.0   release   candidate")).toBe("v1.0-release-candidate");
  });

  it("strips characters git forbids in a ref name", () => {
    expect(sanitizeTagName("v1.0release:new*~^[\\@{}")).toBe("v1.0releasenew");
  });

  it("leaves an already-valid name untouched", () => {
    expect(sanitizeTagName("v2.1.0")).toBe("v2.1.0");
  });
});
