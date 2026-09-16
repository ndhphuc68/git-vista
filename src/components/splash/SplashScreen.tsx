import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useTranslation } from "../../i18n";

export interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
  skipSplash?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 1800,
  skipSplash = false,
}) => {
  const { t } = useTranslation();
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

  if (skipSplash) return null;

  return (
    <div
      data-testid="splash-screen"
      role="dialog"
      aria-label="GitVista Loading"
      className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-window select-none",
        "transition-all duration-300 ease-macos",
        isExiting
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100"
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute w-80 h-80 rounded-full bg-accent/15 blur-3xl -z-10 animate-pulse-glow" />

      {/* Center Branding Card */}
      <div className="flex flex-col items-center gap-5 text-center px-6">
        {/* App Logo */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-3xl bg-surface border border-border-subtle shadow-md flex items-center justify-center overflow-hidden animate-scale-in">
            <img
              src="/app-icon.png"
              alt="GitVista Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex flex-col items-center gap-1 animate-slide-up">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              GitVista
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
              v0.1
            </span>
          </div>
          <p className="text-sm text-secondary max-w-[280px] leading-relaxed">
            {t.welcome?.tagline || "Visual Git Client"}
          </p>
        </div>

        {/* Ambient progress line */}
        <div className="w-48 h-1 bg-border-subtle rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-accent rounded-full animate-pulse"
            style={{
              width: "100%",
              transition: `width ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
