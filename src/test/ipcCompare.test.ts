import { describe, it, expect, beforeEach } from "vitest";
import { invokeCommand, resetMockCompareData } from "../ipc/client";
import { vi } from "../i18n/vi";
import { en } from "../i18n/en";

describe("IPC Client - Compare Commits and Branches", () => {
  beforeEach(() => {
    resetMockCompareData?.();
  });

  it("fetches compare summary in mock mode", async () => {
    const summary = await invokeCommand.compareCommits(
      "/path/to/repo",
      "main",
      "feature/auth",
      "MergeBase"
    );
    expect(summary).toBeDefined();
    expect(summary.base_rev).toBe("main");
    expect(summary.target_rev).toBe("feature/auth");
    expect(summary.mode).toBe("MergeBase");
    expect(summary.commits.length).toBeGreaterThan(0);
    expect(summary.files.length).toBeGreaterThan(0);
    expect(summary.ahead_count).toBeGreaterThanOrEqual(1);
  });

  it("fetches compare file diff in mock mode", async () => {
    const fileDiff = await invokeCommand.getCompareFileDiff(
      "/path/to/repo",
      "main",
      "feature/auth",
      "src/auth.ts",
      "MergeBase",
      false
    );
    expect(fileDiff).toBeDefined();
    expect(fileDiff.file_path).toBe("src/auth.ts");
    expect(fileDiff.hunks.length).toBeGreaterThan(0);
  });

  it("ensures 100% bilingual parity for compare strings", () => {
    // Graph context menu
    expect(vi.graph.compareWith).toBeDefined();
    expect(en.graph.compareWith).toBeDefined();

    // Branch context menu in sidebar
    expect(vi.sidebar.compareWithCurrent).toBeDefined();
    expect(en.sidebar.compareWithCurrent).toBeDefined();

    // Command palette
    expect(vi.palette.commands.gitCompareTitle).toBeDefined();
    expect(en.palette.commands.gitCompareTitle).toBeDefined();
    expect(vi.palette.commands.gitCompareDesc).toBeDefined();
    expect(en.palette.commands.gitCompareDesc).toBeDefined();

    // Compare modal
    const viCompare = vi.compare;
    const enCompare = en.compare;

    expect(viCompare).toBeDefined();
    expect(enCompare).toBeDefined();

    const viKeys = Object.keys(viCompare) as Array<keyof typeof viCompare>;
    for (const key of viKeys) {
      expect(enCompare[key]).toBeDefined();
    }
  });
});
