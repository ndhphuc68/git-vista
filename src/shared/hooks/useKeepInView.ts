import { useLayoutEffect, type RefObject } from "react";

interface HorizontalBounds {
  left: number;
  right: number;
}

/**
 * The horizontal area in which `el` can actually be seen: the viewport,
 * narrowed by every ancestor that clips its overflow (e.g. a scrollable
 * sidebar).
 */
function visibleBounds(el: HTMLElement): HorizontalBounds {
  const bounds = { left: 0, right: document.documentElement.clientWidth };
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).overflowX === "visible") continue;
    const rect = node.getBoundingClientRect();
    bounds.left = Math.max(bounds.left, rect.left);
    bounds.right = Math.min(bounds.right, rect.right);
  }
  return bounds;
}

/**
 * Keeps an absolutely positioned popup (dropdown, context menu) horizontally
 * inside the area where it can be seen. The popup is first narrowed if it is
 * wider than that area, then nudged sideways if it still sticks out. Runs
 * before paint on every render, so the popup never flashes clipped — e.g. a
 * right-anchored menu in a narrow sidebar that would otherwise grow past the
 * sidebar's left edge.
 */
export function useKeepInView(ref: RefObject<HTMLElement | null>, margin = 8): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measure from the natural size and position, not from a previous fit.
    el.style.minWidth = "";
    el.style.maxWidth = "";
    el.style.translate = "";

    const bounds = visibleBounds(el);
    const available = bounds.right - bounds.left - 2 * margin;
    if (el.getBoundingClientRect().width > available) {
      // A min-width class would otherwise win over the narrower max-width.
      el.style.minWidth = "0";
      el.style.maxWidth = `${Math.max(available, 0)}px`;
    }

    const { left, right } = el.getBoundingClientRect();
    let dx = 0;
    if (left < bounds.left + margin) dx = bounds.left + margin - left;
    else if (right > bounds.right - margin) dx = bounds.right - margin - right;

    if (dx !== 0) el.style.translate = `${dx}px 0`;
  });
}
