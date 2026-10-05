/** Number of characters shown when truncating a commit SHA. */
export const SHORT_SHA_LENGTH = 7;

/** How long the "copied" state stays on before it resets itself. */
export const COPY_FEEDBACK_MS = 2000;

/** Delay before focusing an input in a modal, to let the open animation finish. */
export const AUTOFOCUS_DELAY_MS = 50;

/** How long the undo toast stays visible, long enough for the user to click Undo. */
export const UNDO_TOAST_MS = 10000;

/** Fixed width of the desktop sidebar, in pixels. The sidebar is not resizable. */
export const SIDEBAR_WIDTH = 350;

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Max width of a modal for each size tier.
 *
 * `full` is for dialogs sized against the viewport rather than their content
 * (settings, compare) — it deliberately sets no max width, so those modals
 * set their own dimensions on a wrapper instead of being clamped here.
 */
export const MODAL_SIZE: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
  full: "max-w-none",
};
