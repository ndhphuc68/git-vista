import type { HelpTooltipProps } from "./HelpTooltip";

type Placement = NonNullable<HelpTooltipProps["placement"]>;

// Exported for unit testing only.
export const PLACEMENT_CLASSES: Record<Placement, string> = {
  "bottom-left": "top-full left-0 mt-2",
  "bottom-right": "top-full right-0 mt-2",
  "top-left": "bottom-full left-0 mb-2",
  "top-right": "bottom-full right-0 mb-2",
};

export function getPlacementClass(placement: Placement): string {
  return PLACEMENT_CLASSES[placement] ?? PLACEMENT_CLASSES["bottom-left"];
}
