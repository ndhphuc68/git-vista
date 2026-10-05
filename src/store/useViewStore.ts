import { SCREEN_TYPE, type ScreenType } from "../domain/enums";
import { create } from "zustand";

export type ActiveScreen = ScreenType;

export interface ViewState {
  activeScreen: ActiveScreen;
  activeConflictFile: string | null;
  setActiveScreen: (screen: ActiveScreen) => void;
  openConflictResolver: (filePath: string) => void;
  closeConflictResolver: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeScreen: SCREEN_TYPE.HISTORY,
  activeConflictFile: null,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  openConflictResolver: (filePath) =>
    set({ activeScreen: SCREEN_TYPE.CONFLICT, activeConflictFile: filePath }),
  closeConflictResolver: () => set({ activeScreen: SCREEN_TYPE.CHANGES, activeConflictFile: null }),
}));
