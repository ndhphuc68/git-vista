import { create } from "zustand";

export type InspectorTab = "blame" | "history";

interface InspectorState {
  isOpen: boolean;
  filePath: string | null;
  commitId: string | null;
  activeTab: InspectorTab;
  openInspector: (filePath: string, tab?: InspectorTab, commitId?: string | null) => void;
  closeInspector: () => void;
  setActiveTab: (tab: InspectorTab) => void;
}

export const useInspectorStore = create<InspectorState>((set) => ({
  isOpen: false,
  filePath: null,
  commitId: null,
  activeTab: "blame",
  openInspector: (filePath: string, tab = "blame", commitId = null) =>
    set({
      isOpen: true,
      filePath,
      activeTab: tab,
      commitId,
    }),
  closeInspector: () =>
    set({
      isOpen: false,
      filePath: null,
      commitId: null,
    }),
  setActiveTab: (tab: InspectorTab) =>
    set({
      activeTab: tab,
    }),
}));
