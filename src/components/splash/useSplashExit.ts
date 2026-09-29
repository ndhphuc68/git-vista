import { useEffect, useState } from "react";

/**
 * Drives the splash screen's intro-then-exit timing: calls `onFinish` right
 * away when `skipSplash` is set, otherwise schedules the fade-out class and
 * the finish callback, respecting prefers-reduced-motion. Returns whether the
 * exit (fade-out) state is currently active.
 */
export function useSplashExit(onFinish: () => void, duration: number, skipSplash: boolean) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (skipSplash) {
      onFinish();
      return;
    }

    // Check if user has prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const introTime = prefersReducedMotion ? 200 : duration;
    const exitTime = prefersReducedMotion ? 50 : 300;

    const timer1 = setTimeout(() => {
      setIsExiting(true);
    }, introTime);

    const timer2 = setTimeout(() => {
      onFinish();
    }, introTime + exitTime);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [duration, skipSplash, onFinish]);

  return isExiting;
}
