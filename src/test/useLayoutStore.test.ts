import { describe, it, expect, beforeEach } from "vitest";
import { useLayoutStore } from "../store/useLayoutStore";

describe("useLayoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({
      sidebarOpen: true,
      detailPanelOpen: true,
      controlsOpen: true,
      devToolsOpen: false,
      activeChangesView: "split",
    });
  });

  it("has correct initial defaults", () => {
    const state = useLayoutStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.detailPanelOpen).toBe(true);
    expect(state.controlsOpen).toBe(true);
    expect(state.devToolsOpen).toBe(false);
    expect(state.activeChangesView).toBe("split");
  });

  it("toggles sidebarOpen", () => {
    const { toggleSidebar } = useLayoutStore.getState();
    toggleSidebar();
    expect(useLayoutStore.getState().sidebarOpen).toBe(false);
    toggleSidebar();
    expect(useLayoutStore.getState().sidebarOpen).toBe(true);
  });

  it("toggles detailPanelOpen", () => {
    const { toggleDetailPanel } = useLayoutStore.getState();
    toggleDetailPanel();
    expect(useLayoutStore.getState().detailPanelOpen).toBe(false);
    toggleDetailPanel();
    expect(useLayoutStore.getState().detailPanelOpen).toBe(true);
  });

  it("toggles controlsOpen and devToolsOpen", () => {
    const { toggleControls, toggleDevTools } = useLayoutStore.getState();
    toggleControls();
    expect(useLayoutStore.getState().controlsOpen).toBe(false);
    toggleDevTools();
    expect(useLayoutStore.getState().devToolsOpen).toBe(true);
  });

  it("updates activeChangesView", () => {
    const { setActiveChangesView } = useLayoutStore.getState();
    setActiveChangesView("files");
    expect(useLayoutStore.getState().activeChangesView).toBe("files");
    setActiveChangesView("diff");
    expect(useLayoutStore.getState().activeChangesView).toBe("diff");
  });
});
