import { useEffect, useState } from "react";
import { type ToastItem as ToastItemType, useToastStore } from "../../store/useToastStore";

export interface UseToastItemResult {
  isUndoing: boolean;
  showDetails: boolean;
  setShowDetails: (updater: (prev: boolean) => boolean) => void;
  handleUndo: () => Promise<void>;
  handleClose: () => void;
  rawError: string | undefined;
  actionHint: string | undefined;
}

/**
 * Holds ToastItem's state, the auto-dismiss timer effect, and the undo/close
 * handlers, so the component itself stays a thin render function.
 */
export function useToastItem(toast: ToastItemType): UseToastItemResult {
  const [isUndoing, setIsUndoing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (!toast.durationMs || toast.durationMs <= 0) return;

    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, toast.durationMs, removeToast]);

  const handleUndo = async () => {
    if (isUndoing || !toast.undoAction) return;
    setIsUndoing(true);
    try {
      await toast.undoAction();
    } catch (err) {
      console.error("Undo action failed:", err);
    } finally {
      removeToast(toast.id);
    }
  };

  const handleClose = () => removeToast(toast.id);

  const rawError = toast.rawError || toast.friendlyError?.rawError;
  const actionHint = toast.friendlyError?.actionHint;

  return { isUndoing, showDetails, setShowDetails, handleUndo, handleClose, rawError, actionHint };
}
