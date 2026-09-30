import { describe, expect, it } from "vitest";
import { parseTabSession } from "./tabSession";

describe("parseTabSession", () => {
  it("returns the stored paths and active tab", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a", "/b"], activeTabId: "/b" });
    expect(parseTabSession(raw)).toEqual({ openRepoPaths: ["/a", "/b"], activeTabId: "/b" });
  });

  it("drops a non-string active tab id", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a"], activeTabId: 7 });
    expect(parseTabSession(raw)).toEqual({ openRepoPaths: ["/a"], activeTabId: undefined });
  });

  it("skips non-string paths", () => {
    const raw = JSON.stringify({ openRepoPaths: ["/a", 3, null] });
    expect(parseTabSession(raw)?.openRepoPaths).toEqual(["/a"]);
  });

  it.each([["null"], ["[]"], ['"text"'], ["{}"], ['{"openRepoPaths":"/a"}']])(
    "returns null for %s",
    (raw) => {
      expect(parseTabSession(raw)).toBeNull();
    }
  );

  it("throws on invalid JSON so the caller's catch still logs it", () => {
    expect(() => parseTabSession("{not json")).toThrow(SyntaxError);
  });
});
