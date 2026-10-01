import { useRef } from "react";

/**
 * Returns a runner that ignores a task while a previous one is still running.
 *
 * The flag lives in a ref rather than state so two clicks landing before the
 * next render (a fast double click, a key repeat) still see it set.
 */
export function useSingleFlight() {
  const running = useRef(false);

  return async (task: () => Promise<void>): Promise<void> => {
    if (running.current) return;
    running.current = true;
    try {
      await task();
    } finally {
      running.current = false;
    }
  };
}
