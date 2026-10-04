import { describe, it, expect } from "vitest";
import { parsePatch } from "./patchParser";

describe("parsePatch", () => {
  it("handles empty or whitespace patches", () => {
    expect(parsePatch("")).toEqual([]);
  });

  it("parses single hunk and tracks old/new line numbers", () => {
    const patch = ["@@ -5,3 +5,4 @@", " a", "-b", "+c", "+d", " e"].join("\n");
    const lines = parsePatch(patch);

    expect(lines).toHaveLength(6);
    expect(lines[0]?.type).toBe("hunk");
    expect(lines[1]).toMatchObject({
      type: "ctx",
      sign: " ",
      content: "a",
      oldLine: 5,
      newLine: 5,
    });
    expect(lines[2]).toMatchObject({
      type: "del",
      sign: "-",
      content: "b",
      oldLine: 6,
    });
    expect(lines[3]).toMatchObject({
      type: "add",
      sign: "+",
      content: "c",
      newLine: 6,
    });
    expect(lines[4]).toMatchObject({
      type: "add",
      sign: "+",
      content: "d",
      newLine: 7,
    });
    expect(lines[5]).toMatchObject({
      type: "ctx",
      sign: " ",
      content: "e",
      oldLine: 7,
      newLine: 8,
    });
  });

  it("handles meta lines without line number increments", () => {
    const patch = [
      "@@ -1,1 +1,1 @@",
      "-old",
      "\\ No newline at end of file",
      "+new",
      "\\ No newline at end of file",
    ].join("\n");

    const lines = parsePatch(patch);
    expect(lines).toHaveLength(5);
    expect(lines[2]?.content).toBe("\\ No newline at end of file");
    expect(lines[2]?.oldLine).toBeUndefined();
    expect(lines[2]?.newLine).toBeUndefined();
  });
});
