import { create } from "zustand";

export type ActiveScreen = "history" | "changes";

export interface ViewState {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeScreen: "history",
  setActiveScreen: (screen) => set({ activeScreen: screen }),
}));
