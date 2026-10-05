import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDiffDisplaySettings } from "./useDiffDisplaySettings";
import { useSettingsStore } from "../../store/useSettingsStore";

describe("useDiffDisplaySettings", () => {
  it("maps the diff settings to a container style and flags", () => {
    useSettingsStore.setState({
      diffFontSize: 16,
      diffTabSize: 8,
      diffShowLineNumbers: false,
      diffViewMode: "split",
    });
    const { result } = renderHook(() => useDiffDisplaySettings());
    expect(result.current.style).toEqual({ fontSize: "16px", tabSize: 8 });
    expect(result.current.showLineNumbers).toBe(false);
    expect(result.current.viewMode).toBe("split");
  });
});
