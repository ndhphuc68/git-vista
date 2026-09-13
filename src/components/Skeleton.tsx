import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "16px",
  style,
}) => {
  return (
    <div
      className={clsx("skeleton rounded-sm", className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

