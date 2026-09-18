import { describe, it, expect } from "vitest";
import { toErrorMessage } from "./toError";

describe("toErrorMessage", () => {
  it("lấy message từ Error", () => {
    expect(toErrorMessage(new Error("hỏng rồi"))).toBe("hỏng rồi");
  });

  it("chuyển chuỗi thành chính nó", () => {
    expect(toErrorMessage("lỗi dạng chuỗi")).toBe("lỗi dạng chuỗi");
  });

  it("chuyển giá trị lạ thành chuỗi thay vì ném lỗi tiếp", () => {
    expect(toErrorMessage(404)).toBe("404");
    expect(toErrorMessage(null)).toBe("null");
    expect(toErrorMessage(undefined)).toBe("undefined");
  });

  it("lấy trường message của object giống Error do Tauri trả về", () => {
    expect(toErrorMessage({ message: "loi tu Rust" })).toBe("loi tu Rust");
  });
});
