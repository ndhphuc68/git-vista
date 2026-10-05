import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { formatAbsoluteDate, formatCommitDate, getTranslation, useFormatDate } from "./index";
import { useSettingsStore } from "../store/useSettingsStore";

const TIMESTAMP = 1_700_000_000; // 2023-11-14 UTC

function expectedAbsolute(locale: "vi" | "en") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(TIMESTAMP * 1000)
  );
}

describe("formatCommitDate", () => {
  it("formats relative time in relative mode", () => {
    const time = getTranslation("en").diff.time;
    const nowSec = Math.floor(Date.now() / 1000);
    expect(formatCommitDate(nowSec - 120, time, "en", "relative")).toBe("2m ago");
  });

  it("formats an absolute date in the given locale", () => {
    const time = getTranslation("vi").diff.time;
    expect(formatCommitDate(TIMESTAMP, time, "vi", "absolute")).toBe(expectedAbsolute("vi"));
    expect(formatAbsoluteDate(TIMESTAMP, "en")).toBe(expectedAbsolute("en"));
  });
});

describe("useFormatDate", () => {
  beforeEach(() => {
    useSettingsStore.getState().setLocale("en");
  });

  afterEach(() => {
    act(() => {
      useSettingsStore.getState().setLocale("vi");
      useSettingsStore.getState().setDateFormat("relative");
    });
  });

  it("follows the date format setting", () => {
    useSettingsStore.getState().setDateFormat("absolute");
    const { result } = renderHook(() => useFormatDate());
    expect(result.current(TIMESTAMP)).toBe(expectedAbsolute("en"));
    act(() => {
      useSettingsStore.getState().setDateFormat("relative");
    });
    const nowSec = Math.floor(Date.now() / 1000);
    expect(result.current(nowSec - 120)).toBe("2m ago");
  });
});
