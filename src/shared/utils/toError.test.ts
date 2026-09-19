import { describe, it, expect } from "vitest";
import { toErrorMessage } from "./toError";

describe("toErrorMessage", () => {
  it("takes the message from an Error", () => {
    expect(toErrorMessage(new Error("hỏng rồi"))).toBe("hỏng rồi");
  });

  it("converts a string into itself", () => {
    expect(toErrorMessage("lỗi dạng chuỗi")).toBe("lỗi dạng chuỗi");
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
