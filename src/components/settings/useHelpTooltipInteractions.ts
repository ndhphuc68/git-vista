import { useEffect, useId, useRef, useState } from "react";
import { isClickOutsideTooltip } from "./helpTooltipDismissal";

export interface HelpTooltipInteractions {
  isOpen: boolean;
  isPinned: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  tooltipId: string;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleToggleClick: (e: React.MouseEvent) => void;
  handleClose: (e?: React.MouseEvent) => void;
}

/**
 * Holds the open/pinned state, hover-intent timer and outside-click/Escape
 * handling shared by every HelpTooltip instance.
 */
export function useHelpTooltipInteractions(): HelpTooltipInteractions {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const closeAndUnpin = () => {
    setIsOpen(false);
    setIsPinned(false);
  };

  const handleMouseEnter = () => {
    clearTimer();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearTimer();
    if (!isPinned) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimer();
    if (isOpen && isPinned) {
      closeAndUnpin();
    } else {
      setIsOpen(true);
      setIsPinned(true);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearTimer();
    closeAndUnpin();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAndUnpin();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isClickOutsideTooltip(e.target as Node, triggerRef, popoverRef)) {
        closeAndUnpin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    isOpen,
    isPinned,
    triggerRef,
    popoverRef,
    tooltipId,
    handleMouseEnter,
    handleMouseLeave,
    handleToggleClick,
    handleClose,
  };
}
