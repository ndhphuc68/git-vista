/**
 * App-wide z-index scale.
 *
 * Modals and their backdrops live above all application workspace layers
 * (sidebars, toolbars, drawers, banners, and menus) so dialogs always appear on
 * top of the entire interface.
 */
export const Z_INDEX = {
  dropdown: 10,
  overlay: 20,
  modal: 1000,
  toast: 2000,
  /** A modal opened from within another modal (modal-in-modal). */
  modalStacked: 1100,
  /** Fullscreen blocking overlay for app-wide async Git operations. */
  globalLoading: 3000,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
