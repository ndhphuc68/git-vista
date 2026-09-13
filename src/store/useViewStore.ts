import { create } from "zustand";

export type ActiveScreen = "history" | "changes" | "conflict";

export interface ViewState {
  activeScreen: ActiveScreen;
  activeConflictFile: string | null;
  setActiveScreen: (screen: ActiveScreen) => void;
  openConflictResolver: (filePath: string) => void;
  closeConflictResolver: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeScreen: "history",
  activeConflictFile: null,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  openConflictResolver: (filePath) =>
    set({ activeScreen: "conflict", activeConflictFile: filePath }),
  closeConflictResolver: () =>
    set({ activeScreen: "changes", activeConflictFile: null }),
}));
