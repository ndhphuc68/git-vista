import React, { useState, useRef, useEffect, useId } from "react";
import { HelpCircle, X } from "lucide-react";

export interface HelpTooltipProps {
  title: string;
  description: string;
  tag?: string;
  diagram?: React.ReactNode;
  placement?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  description,
  tag,
  diagram,
  placement = "bottom-left",
  className = "",
}) => {
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
      setIsOpen(false);
      setIsPinned(false);
    } else {
      setIsOpen(true);
      setIsPinned(true);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearTimer();
    setIsOpen(false);
    setIsPinned(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsPinned(false);
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

  // Compute position relative to trigger
  const getPlacementClass = () => {
    switch (placement) {
      case "bottom-right":
        return "top-full right-0 mt-2";
      case "top-left":
        return "bottom-full left-0 mb-2";
      case "top-right":
        return "bottom-full right-0 mb-2";
      case "bottom-left":
      default:
        return "top-full left-0 mt-2";
    }
  };

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Trợ giúp: ${title}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggleClick}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
          isOpen
            ? "bg-accent text-white shadow-sm ring-1 ring-accent"
            : "text-secondary hover:text-accent bg-surface-header/80 hover:bg-accent/15 border border-border-subtle hover:border-accent/40"
        }`}
      >
        <span className="leading-none select-none">?</span>
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute z-[100] w-96 max-w-[calc(100vw-32px)] bg-surface border border-border-subtle rounded-xl shadow-2xl p-4 text-primary animate-fade-in ${getPlacementClass()}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary text-sm flex items-center gap-1.5">
                <HelpCircle size={15} className="text-accent shrink-0" />
                {title}
              </span>
              {tag && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                  {tag}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Đóng trợ giúp"
              onClick={handleClose}
              className="text-tertiary hover:text-primary p-1 rounded transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Diagram preview if available */}
          {diagram && (
            <div className="mb-3 rounded-lg border border-border-subtle/80 bg-surface-header/40 p-2.5 overflow-hidden select-none">
              {diagram}
            </div>
          )}

          {/* Description */}
          <p className="text-[13px] text-secondary leading-relaxed font-normal">{description}</p>

          {isPinned && (
            <div className="mt-2.5 pt-2 border-t border-border-subtle/50 flex justify-end">
              <span className="text-xs text-tertiary italic">
                Nhấn ESC hoặc bấm ra ngoài để đóng
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
