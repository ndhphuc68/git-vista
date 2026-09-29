import { describe, it, expect } from "vitest";
import { sanitizeBranchName } from "../features/branch/model/branchName";

describe("sanitizeBranchName", () => {
  it("turns spaces into dashes", () => {
    expect(sanitizeBranchName("feature awesome login")).toBe("feature-awesome-login");
  });

  it("collapses runs of whitespace into a single dash", () => {
    expect(sanitizeBranchName("feature   login")).toBe("feature-login");
  });

  it("strips characters Git disallows in a ref name", () => {
    expect(sanitizeBranchName("feature~^:?*[\\@{}name")).toBe("featurename");
  });

  it("leaves an already-valid name untouched", () => {
    expect(sanitizeBranchName("feature/login-v2")).toBe("feature/login-v2");
  });
});
