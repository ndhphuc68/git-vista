import { describe, it, expect } from "vitest";
import { shortSha } from "./git";

describe("shortSha", () => {
  it("truncates a full SHA to 7 characters", () => {
    expect(shortSha("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0")).toBe("a1b2c3d");
  });

  it("keeps a string shorter than 7 characters unchanged", () => {
    expect(shortSha("abc")).toBe("abc");
  });

  it("returns an empty string for empty input", () => {
    expect(shortSha("")).toBe("");
  });
});
