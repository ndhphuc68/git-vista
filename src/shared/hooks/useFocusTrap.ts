import { useEffect, type RefObject } from "react";

/**
 * Elements that can receive keyboard focus. `[data-autofocus]` is not a
 * focusable selector itself — it is a marker callers add to whichever of
 * these should be focused first (e.g. a text input rather than the Cancel
 * button).
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Registry of currently-active traps. Only ONE of them handles Tab —
 * otherwise a nested dialog and its parent would both try to wrap focus on
 * the same keypress.
 *
 * The owner is resolved by DOM depth, not registration order: React mounts
 * children before parents, so an outer dialog's effect runs *after* its
 * nested child's and would otherwise be mistaken for the innermost one.
 */
const registry: Array<HTMLElement> = [];

/**
 * The trap that should handle Tab: the most deeply nested active container.
 * For DOM-nested traps, depth decides. For sibling traps (the common case:
 * a stacked modal rendered next to its parent rather than inside it),
 * nothing contains anything, so the most recently registered one wins.
 */
function activeTrap(): HTMLElement | undefined {
  let owner: HTMLElement | undefined;
  for (const container of registry) {
    // Later registrations win ties; an ancestor never beats its descendant.
    if (!owner || !container.contains(owner)) owner = container;
  }
  return owner;
}

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  // jsdom reports zero-sized rects for everything, so size is not a usable
  // signal here; rely on explicit hiding only.
  return true;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && isVisible(el)
  );
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key !== "Tab") return;

  const container = activeTrap();
  if (!container) return;

  const focusable = getFocusable(container);
  if (focusable.length === 0) {
    // Nothing to cycle through; keep focus pinned to the container so Tab
    // cannot walk out into the page behind the dialog.
    e.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;

  // Focus somehow escaped the container (or never entered it) — pull it back.
  if (!(active instanceof HTMLElement) || !container.contains(active)) {
    e.preventDefault();
    first.focus();
    return;
  }

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
    return;
  }

  if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }

  // Anything in between: let the browser's native tab order do the move.
}

let listenerAttached = false;

function ensureListener(): void {
  if (listenerAttached) return;
  window.addEventListener("keydown", handleKeyDown);
  listenerAttached = true;
}

function teardownListenerIfIdle(): void {
  if (registry.length > 0) return;
  window.removeEventListener("keydown", handleKeyDown);
  listenerAttached = false;
}

/**
 * Keeps keyboard focus inside `containerRef` while `enabled` is true.
 *
 * Three behaviours, which together are what "focus management" means for a
 * dialog:
 *
 * 1. **Initial focus** — on enable, focus moves into the container: to the
 *    element marked `data-autofocus` if there is one, else the first
 *    focusable child, else the container itself.
 * 2. **Trap** — Tab and Shift+Tab wrap around inside the container instead
 *    of reaching the page behind it.
 * 3. **Restore** — on disable or unmount, focus returns to whatever was
 *    focused before the trap activated (unless that element is gone).
 *
 * With nested dialogs only the innermost active trap handles Tab, and each
 * one restores to its own opener as it closes — so closing a child dialog
 * hands focus back to the parent dialog, not to the page.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    registry.push(container);
    ensureListener();

    const preferred = container.querySelector<HTMLElement>("[data-autofocus]");
    const target = preferred ?? getFocusable(container)[0] ?? container;
    if (target === container && !container.hasAttribute("tabindex")) {
      // Make the container itself focusable as a last resort, so focus has
      // somewhere to land inside the dialog rather than staying outside it.
      container.setAttribute("tabindex", "-1");
    }
    target.focus();

    return () => {
      const index = registry.indexOf(container);
      if (index !== -1) registry.splice(index, 1);
      teardownListenerIfIdle();

      // Only restore if focus is still inside (or was lost to the body by
      // the container unmounting) — if the app deliberately moved focus
      // elsewhere, leave it alone.
      const active = document.activeElement;
      const focusStillOurs =
        active === null || active === document.body || container.contains(active);

      if (focusStillOurs && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [enabled, containerRef]);
}
