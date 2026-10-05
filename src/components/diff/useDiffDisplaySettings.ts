import type { CSSProperties } from "react";
import { useSettingsStore, type DiffViewMode } from "../../store/useSettingsStore";

export interface DiffDisplaySettings {
  /** Font size and tab width from Settings › Diff viewer, for the viewer's scroll container. */
  style: CSSProperties;
  showLineNumbers: boolean;
  viewMode: DiffViewMode;
}

/** Diff viewer display settings shared by every diff viewer. */
export function useDiffDisplaySettings(): DiffDisplaySettings {
  const fontSize = useSettingsStore((s) => s.diffFontSize);
  const tabSize = useSettingsStore((s) => s.diffTabSize);
  const showLineNumbers = useSettingsStore((s) => s.diffShowLineNumbers);
  const viewMode = useSettingsStore((s) => s.diffViewMode);
  return { style: { fontSize: `${fontSize}px`, tabSize }, showLineNumbers, viewMode };
}
