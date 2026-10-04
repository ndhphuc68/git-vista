import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PullRequestPatchDiffViewer } from "./PullRequestPatchDiffViewer";
import { parsePatch } from "../model/patchParser";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { vi as viTranslations } from "../../../i18n/vi";

beforeEach(() => {
  useSettingsStore.setState({ locale: "vi" });
});

afterEach(() => {
  cleanup();
});

describe("parsePatch", () => {
  it("returns an empty array for empty or undefined patch", () => {
    expect(parsePatch("")).toEqual([]);
  });

  it("parses unified diff hunks with accurate line numbers and signs", () => {
    const patch = [
      "@@ -10,4 +10,5 @@",
      " unchanged 1",
      "-removed line",
      "+added line 1",
      "+added line 2",
      " unchanged 2",
    ].join("\n");

    const lines = parsePatch(patch);
    expect(lines).toHaveLength(6);

    expect(lines[0]).toMatchObject({
      type: "hunk",
      content: "@@ -10,4 +10,5 @@",
    });

    expect(lines[1]).toMatchObject({
      type: "ctx",
      sign: " ",
      content: "unchanged 1",
      oldLine: 10,
      newLine: 10,
    });

    expect(lines[2]).toMatchObject({
      type: "del",
      sign: "-",
      content: "removed line",
      oldLine: 11,
    });
    expect(lines[2]?.newLine).toBeUndefined();

    expect(lines[3]).toMatchObject({
      type: "add",
      sign: "+",
      content: "added line 1",
      newLine: 11,
    });
    expect(lines[3]?.oldLine).toBeUndefined();

    expect(lines[4]).toMatchObject({
      type: "add",
      sign: "+",
      content: "added line 2",
      newLine: 12,
    });
    expect(lines[4]?.oldLine).toBeUndefined();

    expect(lines[5]).toMatchObject({
      type: "ctx",
      sign: " ",
      content: "unchanged 2",
      oldLine: 12,
      newLine: 13,
    });
  });

  it("tracks line numbers across multiple hunks", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      "-old first",
      "+new first",
      " unchanged",
      "@@ -50,2 +50,2 @@",
      "-old fifty",
      "+new fifty",
      " unchanged fifty",
    ].join("\n");

    const lines = parsePatch(patch);
    const hunk2Del = lines.find((l) => l.content === "old fifty");
    const hunk2Add = lines.find((l) => l.content === "new fifty");

    expect(hunk2Del?.oldLine).toBe(50);
    expect(hunk2Add?.newLine).toBe(50);
  });
});

describe("PullRequestPatchDiffViewer", () => {
  it("renders empty diff fallback when patch is missing", () => {
    render(<PullRequestPatchDiffViewer filename="src/test.ts" />);

    expect(screen.getByText("src/test.ts")).toBeInTheDocument();
    expect(
      screen.getByText(viTranslations.pullRequestsScreen.files.noDiff)
    ).toBeInTheDocument();
  });

  it("renders empty diff fallback when patch is empty or whitespace only", () => {
    render(
      <PullRequestPatchDiffViewer patch="   " filename="README.md" />
    );

    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(
      screen.getByText(viTranslations.pullRequestsScreen.files.noDiff)
    ).toBeInTheDocument();
  });

  it("renders diff header and parsed lines with styling tokens", () => {
    const patch = [
      "@@ -1,3 +1,3 @@",
      " const a = 1;",
      "-const b = 2;",
      "+const b = 3;",
      " const c = 4;",
    ].join("\n");

    const { container } = render(
      <PullRequestPatchDiffViewer
        patch={patch}
        filename="src/constants.ts"
      />
    );

    expect(screen.getByText("src/constants.ts")).toBeInTheDocument();
    expect(screen.getByText("@@ -1,3 +1,3 @@")).toBeInTheDocument();
    expect(screen.getByText("const a = 1;")).toBeInTheDocument();
    expect(screen.getByText("const b = 2;")).toBeInTheDocument();
    expect(screen.getByText("const b = 3;")).toBeInTheDocument();

    const delRow = container.querySelector(".border-rose-500");
    const addRow = container.querySelector(".border-emerald-500");

    expect(delRow).toBeInTheDocument();
    expect(addRow).toBeInTheDocument();
  });
});
