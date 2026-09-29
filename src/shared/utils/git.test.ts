import { describe, it, expect } from "vitest";
import { shortSha, sanitizeRefName } from "./git";

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

describe("sanitizeRefName", () => {
  it("turns spaces into dashes", () => {
    expect(sanitizeRefName("feature awesome login")).toBe("feature-awesome-login");
  });

  it("collapses runs of whitespace into a single dash", () => {
    expect(sanitizeRefName("feature   login")).toBe("feature-login");
  });

  it("strips characters Git disallows in a ref name", () => {
    expect(sanitizeRefName("feature~^:?*[\\@{}name")).toBe("featurename");
  });

  it("leaves an already-valid name untouched", () => {
    expect(sanitizeRefName("feature/login-v2")).toBe("feature/login-v2");
  });

  it("replaces spaces with a dash for tag-style names", () => {
    expect(sanitizeRefName("v1.0 release")).toBe("v1.0-release");
  });

  it("collapses runs of whitespace for tag-style names", () => {
    expect(sanitizeRefName("v1.0   release   candidate")).toBe("v1.0-release-candidate");
  });

  it("strips characters git forbids in a tag-style ref name", () => {
    expect(sanitizeRefName("v1.0release:new*~^[\\@{}")).toBe("v1.0releasenew");
  });

  it("leaves an already-valid tag-style name untouched", () => {
    expect(sanitizeRefName("v2.1.0")).toBe("v2.1.0");
  });
});
