import { describe, expect, it } from "vitest";
import { extractRepoNameFromUrl } from "./repoUrl";

describe("extractRepoNameFromUrl", () => {
  it("takes the last path segment of an https URL and drops .git", () => {
    expect(extractRepoNameFromUrl("https://github.com/acme/widget.git")).toBe("widget");
  });

  it("handles scp-style SSH URLs", () => {
    expect(extractRepoNameFromUrl("git@github.com:acme/widget.git")).toBe("widget");
  });

  it("ignores trailing slashes and surrounding whitespace", () => {
    expect(extractRepoNameFromUrl("  https://github.com/acme/widget/  ")).toBe("widget");
  });

  it("returns an empty string for an empty URL", () => {
    expect(extractRepoNameFromUrl("")).toBe("");
  });
});
