import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../store/useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useSettingsStore.getState();
    store.closeSettings();
    store.setActiveTab("profile");
    store.setDateFormat("relative");
    store.setAvatarStyle("initials");
    store.setDiffViewMode("unified");
    store.setDiffFontSize(13);
    store.setDiffIgnoreWhitespace(false);
    store.setDiffTabSize(4);
    store.setDiffShowLineNumbers(true);
    store.setConfirmDiscard(true);
    store.setConfirmDeleteBranch(true);
    store.setConfirmForcePush(true);
    store.setCommitMessageLimit(50);
    store.setDefaultEditor("code");
    store.setCustomEditorCommand("");
    store.setDefaultTerminal("wt");
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
    useSettingsStore.getState().setActiveTab("diff");
    expect(useSettingsStore.getState().activeTab).toBe("diff");
    useSettingsStore.getState().setActiveTab("tools");
    expect(useSettingsStore.getState().activeTab).toBe("tools");
  });

  it("updates appearance and display options", () => {
    const store = useSettingsStore.getState();
    expect(store.dateFormat).toBe("relative");
    expect(store.avatarStyle).toBe("initials");

    store.setDateFormat("absolute");
    store.setAvatarStyle("gravatar");

    expect(useSettingsStore.getState().dateFormat).toBe("absolute");
    expect(useSettingsStore.getState().avatarStyle).toBe("gravatar");
  });

  it("updates diff viewer options", () => {
    const store = useSettingsStore.getState();
    expect(store.diffViewMode).toBe("unified");
    expect(store.diffFontSize).toBe(13);
    expect(store.diffIgnoreWhitespace).toBe(false);
    expect(store.diffTabSize).toBe(4);
    expect(store.diffShowLineNumbers).toBe(true);

    store.setDiffViewMode("split");
    store.setDiffFontSize(16);
    store.setDiffIgnoreWhitespace(true);
    store.setDiffTabSize(2);
    store.setDiffShowLineNumbers(false);

    const updated = useSettingsStore.getState();
    expect(updated.diffViewMode).toBe("split");
    expect(updated.diffFontSize).toBe(16);
    expect(updated.diffIgnoreWhitespace).toBe(true);
    expect(updated.diffTabSize).toBe(2);
    expect(updated.diffShowLineNumbers).toBe(false);
  });

  it("updates safety confirmations and commit conventions", () => {
    const store = useSettingsStore.getState();
    expect(store.confirmDiscard).toBe(true);
    expect(store.confirmDeleteBranch).toBe(true);
    expect(store.confirmForcePush).toBe(true);
    expect(store.commitMessageLimit).toBe(50);

    store.setConfirmDiscard(false);
    store.setConfirmDeleteBranch(false);
    store.setConfirmForcePush(false);
    store.setCommitMessageLimit(72);

    const updated = useSettingsStore.getState();
    expect(updated.confirmDiscard).toBe(false);
    expect(updated.confirmDeleteBranch).toBe(false);
    expect(updated.confirmForcePush).toBe(false);
    expect(updated.commitMessageLimit).toBe(72);
  });

  it("updates external tools settings", () => {
    const store = useSettingsStore.getState();
    expect(store.defaultEditor).toBe("code");
    expect(store.customEditorCommand).toBe("");
    expect(store.defaultTerminal).toBe("wt");

    store.setDefaultEditor("custom");
    store.setCustomEditorCommand("nvim");
    store.setDefaultTerminal("powershell");

    const updated = useSettingsStore.getState();
    expect(updated.defaultEditor).toBe("custom");
    expect(updated.customEditorCommand).toBe("nvim");
    expect(updated.defaultTerminal).toBe("powershell");
  });
});
