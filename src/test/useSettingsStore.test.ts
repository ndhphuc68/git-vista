import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.getState().closeSettings();
  });

  it("opens settings with default or specified tab", () => {
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
    useSettingsStore.getState().openSettings("appearance");
    expect(useSettingsStore.getState().isSettingsOpen).toBe(true);
    expect(useSettingsStore.getState().activeTab).toBe("appearance");

    useSettingsStore.getState().closeSettings();
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });

  it("switches active tab when opened", () => {
    useSettingsStore.getState().openSettings();
    expect(useSettingsStore.getState().activeTab).toBe("profile");
    useSettingsStore.getState().setActiveTab("behavior");
    expect(useSettingsStore.getState().activeTab).toBe("behavior");
  });
});
