import { describe, it, expect } from "vitest";
import { resolveTargetDirOnUrlChange, resolveTargetDirOnFolderSelect } from "./cloneTargetDir";

describe("resolveTargetDirOnUrlChange", () => {
  it("keeps the current target dir when the url has no repo name", () => {
    expect(resolveTargetDirOnUrlChange("   ", "", "existing")).toBe("existing");
  });

  it("derives the target dir from the base dir and repo name when a folder was picked", () => {
    expect(
      resolveTargetDirOnUrlChange("https://github.com/owner/cool-project.git", "D:\\Projects", "")
    ).toBe("D:\\Projects\\cool-project");
  });

  it("uses forward slashes when the base dir uses forward slashes", () => {
    expect(
      resolveTargetDirOnUrlChange("https://github.com/owner/cool-project.git", "/home/me", "")
    ).toBe("/home/me/cool-project");
  });

  it("fills the empty target dir with just the repo name when no folder was picked", () => {
    expect(resolveTargetDirOnUrlChange("https://github.com/owner/cool-project.git", "", "")).toBe(
      "cool-project"
    );
  });

  it("replaces a target dir that already ends with the previous repo name", () => {
    expect(
      resolveTargetDirOnUrlChange("https://github.com/owner/new-project.git", "", "old-project")
    ).toBe("new-project");
  });

  it("leaves a manually-typed path target dir untouched", () => {
    expect(
      resolveTargetDirOnUrlChange(
        "https://github.com/owner/cool-project.git",
        "",
        "D:\\Somewhere\\else"
      )
    ).toBe("D:\\Somewhere\\else");
  });
});

describe("resolveTargetDirOnFolderSelect", () => {
  it("derives the target dir from the selected folder and the url's repo name", () => {
    expect(
      resolveTargetDirOnFolderSelect("D:\\Projects", "https://github.com/owner/cool-project.git")
    ).toBe("D:\\Projects\\cool-project");
  });

  it("falls back to the selected folder alone when the url has no repo name", () => {
    expect(resolveTargetDirOnFolderSelect("D:\\Projects", "   ")).toBe("D:\\Projects");
  });
});
