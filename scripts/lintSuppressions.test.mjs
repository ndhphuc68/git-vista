import { describe, expect, it } from "vitest";
import { countSuppressions, findSuppressionViolations } from "./lintSuppressions.mjs";

// Directive text is assembled so this file does not match its own pattern.
const ESLINT = "eslint" + "-disable";
const OXLINT = "oxlint" + "-disable";

describe("countSuppressions", () => {
  it.each([
    [`// ${ESLINT}-next-line no-console`, 1],
    [`foo(); // ${OXLINT}-line`, 1],
    [`/* ${ESLINT} */`, 1],
    [`/* ${OXLINT} max-lines */\n// ${ESLINT}-next-line x`, 2],
  ])("counts %j as %i", (content, expected) => {
    expect(countSuppressions(content)).toBe(expected);
  });

  it.each([["// eslint is great"], ["const disable = true;"], ["// eslint-enable"]])(
    "ignores %j",
    (content) => {
      expect(countSuppressions(content)).toBe(0);
    }
  );
});

describe("findSuppressionViolations", () => {
  const baseline = { "src/a.test.ts": 1 };

  it("passes when every file matches its baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 1 }, baseline)).toEqual([]);
  });

  it("flags a file that is not in the baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 1, "src/b.ts": 1 }, baseline)).toEqual([
      { file: "src/b.ts", found: 1, allowed: 0 },
    ]);
  });

  it("flags a file that exceeds its baseline", () => {
    expect(findSuppressionViolations({ "src/a.test.ts": 2 }, baseline)).toEqual([
      { file: "src/a.test.ts", found: 2, allowed: 1 },
    ]);
  });

  it("flags a stale baseline entry so the baseline only shrinks", () => {
    expect(findSuppressionViolations({}, baseline)).toEqual([
      { file: "src/a.test.ts", found: 0, allowed: 1 },
    ]);
  });
});
