import React, { useState, useEffect } from "react";
import clsx from "clsx";

export interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  enterClass?: string;
  exitClass?: string;
  duration?: number;
  unmountOnExit?: boolean;
  className?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  children,
  enterClass = "animate-scale-in",
  exitClass = "opacity-0 scale-95 transition-all duration-200 ease-macos pointer-events-none",
  duration = 200,
  unmountOnExit = true,
  className,
}) => {
  const [mounted, setMounted] = useState(show);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setIsAnimatingOut(false);
    } else if (mounted) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
        if (unmountOnExit) {
          setMounted(false);
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, unmountOnExit, mounted]);

  if (!mounted && unmountOnExit) {
    return null;
  }

  return (
    <div
      className={clsx(
        className,
        show && !isAnimatingOut ? enterClass : exitClass
      )}
    >
      {children}
    </div>
  );
};
