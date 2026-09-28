import { describe, it, expect } from "vitest";
import { toErrorMessage, messageOf } from "./toError";

describe("toErrorMessage", () => {
  it("takes the message from an Error", () => {
    expect(toErrorMessage(new Error("something broke"))).toBe("something broke");
  });

  it("converts a string into itself", () => {
    expect(toErrorMessage("a string error")).toBe("a string error");
  });

  it("converts an unknown value into a string instead of throwing further", () => {
    expect(toErrorMessage(404)).toBe("404");
    expect(toErrorMessage(null)).toBe("null");
    expect(toErrorMessage(undefined)).toBe("undefined");
  });

  it("takes the message field of an Error-like object returned by Tauri", () => {
    expect(toErrorMessage({ message: "loi tu Rust" })).toBe("loi tu Rust");
  });
});

describe("messageOf", () => {
  it("returns the message of an Error", () => {
    expect(messageOf(new Error("boom"))).toBe("boom");
  });

  it("returns the message field of an AppError-shaped object", () => {
    expect(messageOf({ type: "Git", message: "not a repo" })).toBe("not a repo");
  });

  it("returns undefined for a thrown string, so callers keep their fallback", () => {
    expect(messageOf("raw failure")).toBeUndefined();
  });

  it("returns undefined for null, undefined and non-string message fields", () => {
    expect(messageOf(null)).toBeUndefined();
    expect(messageOf(undefined)).toBeUndefined();
    expect(messageOf({ message: 42 })).toBeUndefined();
  });
});
