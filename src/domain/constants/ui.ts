/** Number of characters shown when truncating a commit SHA. */
export const SHORT_SHA_LENGTH = 7;

/** How long the "copied" state stays on before it resets itself. */
export const COPY_FEEDBACK_MS = 2000;

/** Delay before focusing an input in a modal, to let the open animation finish. */
export const AUTOFOCUS_DELAY_MS = 50;

/** How long the undo toast stays visible, long enough for the user to click Undo. */
export const UNDO_TOAST_MS = 10000;

export type ModalSize = "sm" | "md" | "lg" | "xl";

/** Max width of a modal for each size tier. */
export const MODAL_SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};
