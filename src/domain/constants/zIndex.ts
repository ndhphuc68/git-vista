/**
 * App-wide z-index scale. Values are spaced 10 apart so a new layer can be
 * inserted later without renumbering everything else.
 */
export const Z_INDEX = {
  dropdown: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
  /** A modal opened from within another modal (modal-in-modal). */
  modalStacked: 50,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
