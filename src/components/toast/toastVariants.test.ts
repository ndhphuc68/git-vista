import { describe, it, expect } from "vitest";
import { TOAST_ICONS, TOAST_PROGRESS_CLASS, TOAST_ACCENT_CLASS } from "./toastVariants";

describe("toastVariants", () => {
  it("has an icon entry for each toast type", () => {
    expect(Object.keys(TOAST_ICONS).sort()).toEqual(["error", "info", "success"]);
  });

  it("maps each toast type to its progress bar color class", () => {
    expect(TOAST_PROGRESS_CLASS.success).toBe("bg-emerald-500");
    expect(TOAST_PROGRESS_CLASS.error).toBe("bg-rose-500");
    expect(TOAST_PROGRESS_CLASS.info).toBe("bg-sky-500");
  });

  it("maps each toast type to its left accent color class", () => {
    expect(TOAST_ACCENT_CLASS.success).toBe("bg-emerald-400");
    expect(TOAST_ACCENT_CLASS.error).toBe("bg-rose-400");
    expect(TOAST_ACCENT_CLASS.info).toBe("bg-sky-400");
  });
});
