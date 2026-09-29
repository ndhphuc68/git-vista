import type { RefObject } from "react";

/**
 * True when `target` is outside both the tooltip trigger and its popover,
 * meaning a mousedown there should dismiss the tooltip.
 */
export function isClickOutsideTooltip(
  target: Node,
  triggerRef: RefObject<HTMLButtonElement | null>,
  popoverRef: RefObject<HTMLDivElement | null>
): boolean {
  return (
    !!triggerRef.current &&
    !triggerRef.current.contains(target) &&
    !!popoverRef.current &&
    !popoverRef.current.contains(target)
  );
}
