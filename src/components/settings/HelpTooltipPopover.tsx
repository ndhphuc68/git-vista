import React from "react";
import { HelpCircle, X } from "lucide-react";

export interface HelpTooltipPopoverProps {
  tooltipId: string;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  description: string;
  tag?: string;
  diagram?: React.ReactNode;
  isPinned: boolean;
  placementClass: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: (e?: React.MouseEvent) => void;
}

export const HelpTooltipPopover: React.FC<HelpTooltipPopoverProps> = ({
  tooltipId,
  popoverRef,
  title,
  description,
  tag,
  diagram,
  isPinned,
  placementClass,
  onMouseEnter,
  onMouseLeave,
  onClose,
}) => {
  return (
    <div
      id={tooltipId}
      ref={popoverRef}
      role="tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute z-[100] w-96 max-w-[calc(100vw-32px)] bg-surface border border-border-subtle rounded-xl shadow-2xl p-4 text-primary animate-fade-in ${placementClass}`}
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
          onClick={onClose}
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
  );
};
