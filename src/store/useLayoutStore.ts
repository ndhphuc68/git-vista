import { create } from "zustand";

export type ChangesViewMode = "split" | "files" | "diff";

export interface LayoutState {
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  controlsOpen: boolean;
  devToolsOpen: boolean;
  activeChangesView: ChangesViewMode;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setDetailPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setControlsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setDevToolsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setActiveChangesView: (view: ChangesViewMode) => void;
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  toggleControls: () => void;
  toggleDevTools: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarOpen: true,
  detailPanelOpen: true,
  controlsOpen: true,
  devToolsOpen: false,
  activeChangesView: "split",

  setSidebarOpen: (open) =>
    set((state) => ({
      sidebarOpen: typeof open === "function" ? open(state.sidebarOpen) : open,
    })),

  setDetailPanelOpen: (open) =>
    set((state) => ({
      detailPanelOpen:
        typeof open === "function" ? open(state.detailPanelOpen) : open,
    })),

  setControlsOpen: (open) =>
    set((state) => ({
      controlsOpen:
        typeof open === "function" ? open(state.controlsOpen) : open,
    })),

  setDevToolsOpen: (open) =>
    set((state) => ({
      devToolsOpen:
        typeof open === "function" ? open(state.devToolsOpen) : open,
    })),

  setActiveChangesView: (view) => set({ activeChangesView: view }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleDetailPanel: () =>
    set((state) => ({ detailPanelOpen: !state.detailPanelOpen })),

  toggleControls: () => set((state) => ({ controlsOpen: !state.controlsOpen })),

  toggleDevTools: () => set((state) => ({ devToolsOpen: !state.devToolsOpen })),
}));
