import { describe, expect, it } from "vitest";
import { computeWordDiff } from "../../utils/wordDiff";
import { diffLineKey, hunkKey, withOffsetKeys } from "./listKeys";

describe("hunkKey", () => {
  it("combines both start positions", () => {
    expect(hunkKey({ old_start: 10, new_start: 12 })).toBe("10:12");
  });

  it("tells apart hunks that share only one start", () => {
    expect(hunkKey({ old_start: 1, new_start: 5 })).not.toBe(
      hunkKey({ old_start: 5, new_start: 1 })
    );
  });
});

describe("diffLineKey", () => {
  it("gives unique keys to the lines of a mixed hunk", () => {
    const lines = [
      { old_lineno: 1, new_lineno: 1 },
      { old_lineno: 2, new_lineno: null },
      { old_lineno: null, new_lineno: 2 },
      { old_lineno: 3, new_lineno: 3 },
    ];
    const keys = lines.map(diffLineKey);
    expect(new Set(keys).size).toBe(lines.length);
  });

  it("does not confuse a deleted and an added line with the same number", () => {
    expect(diffLineKey({ old_lineno: 2, new_lineno: null })).not.toBe(
      diffLineKey({ old_lineno: null, new_lineno: 2 })
    );
  });
});

describe("withOffsetKeys", () => {
  it("keys each token by its character offset", () => {
    const tokens = [{ text: "ab" }, { text: " " }, { text: "c" }];
    expect(withOffsetKeys(tokens).map((t) => t.key)).toEqual([0, 2, 3]);
  });

  it("keeps the original token objects", () => {
    const tokens = [{ text: "x" }];
    expect(withOffsetKeys(tokens)[0]?.token).toBe(tokens[0]);
  });

  it("produces unique keys for a real word diff", () => {
    const { oldTokens, newTokens } = computeWordDiff("const a = 1;", "const b = 1; // x");
    for (const tokens of [oldTokens, newTokens]) {
      const keys = withOffsetKeys(tokens).map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
