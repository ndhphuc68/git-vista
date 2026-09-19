import { useEffect, useRef } from "react";

/**
 * Global registry of currently-enabled instances, in registration order.
 * The LAST-registered instance (the top of the modal stack) is treated as
 * "topmost" — only it is invoked when Escape is pressed. The rest (parent
 * modals underneath) are skipped, so a single Escape press doesn't close
 * the entire modal stack.
 */
const registry: Array<() => void> = [];

let windowListenerAttached = false;

function handleWindowKeyDown(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  e.preventDefault();

  const topmost = registry[registry.length - 1];
  topmost?.();
}

function ensureWindowListener(): void {
  if (windowListenerAttached) return;
  window.addEventListener("keydown", handleWindowKeyDown);
  windowListenerAttached = true;
}

function teardownWindowListenerIfIdle(): void {
  if (registry.length > 0) return;
  window.removeEventListener("keydown", handleWindowKeyDown);
  windowListenerAttached = false;
}

/**
 * Calls `onEscape` when the user presses Escape, but only while `enabled`
 * is true.
 *
 * The callback is kept in a ref, so changing the callback identity doesn't
 * re-attach the listener — callers don't need to wrap it in `useCallback`.
 *
 * When multiple nested modals are enabled at once, only the LAST-registered
 * one (the topmost modal) receives Escape — this prevents a single press
 * from also closing the parent modal.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const callbackRef = useRef(onEscape);
  // A per-instance stable wrapper, used to identify this instance in the
  // registry without depending on onEscape's identity (which can change on
  // every render).
  const dispatchRef = useRef(() => callbackRef.current());

  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const dispatch = dispatchRef.current;
    registry.push(dispatch);
    ensureWindowListener();

    return () => {
      const index = registry.indexOf(dispatch);
      if (index !== -1) registry.splice(index, 1);
      teardownWindowListenerIfIdle();
    };
  }, [enabled]);
}
