import { describe, it, expect } from "vitest";
import { shortSha } from "./git";

describe("shortSha", () => {
  it("rút gọn SHA đầy đủ về 7 ký tự", () => {
    expect(shortSha("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0")).toBe("a1b2c3d");
  });

  it("giữ nguyên chuỗi ngắn hơn 7 ký tự", () => {
    expect(shortSha("abc")).toBe("abc");
  });

  it("trả chuỗi rỗng khi đầu vào rỗng", () => {
    expect(shortSha("")).toBe("");
  });
});
