import React from "react";
import { useHelpTooltipInteractions } from "./useHelpTooltipInteractions";
import { getPlacementClass } from "./helpTooltipPlacement";
import { HelpTooltipPopover } from "./HelpTooltipPopover";

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
  const {
    isOpen,
    isPinned,
    triggerRef,
    popoverRef,
    tooltipId,
    handleMouseEnter,
    handleMouseLeave,
    handleToggleClick,
    handleClose,
  } = useHelpTooltipInteractions();

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
        <HelpTooltipPopover
          tooltipId={tooltipId}
          popoverRef={popoverRef}
          title={title}
          description={description}
          tag={tag}
          diagram={diagram}
          isPinned={isPinned}
          placementClass={getPlacementClass(placement)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
