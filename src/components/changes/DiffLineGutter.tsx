import React from "react";
import clsx from "clsx";

export interface DiffLineGutterProps {
  oldLineno: number | null;
  newLineno: number | null;
  isAdd: boolean;
  isDel: boolean;
  isModifiedLine: boolean;
}

/** Sticky line-number gutter (old/new numbers plus the +/-/space origin sign). */
export const DiffLineGutter: React.FC<DiffLineGutterProps> = ({
  oldLineno,
  newLineno,
  isAdd,
  isDel,
  isModifiedLine,
}) => (
  <div
    className={clsx(
      "flex items-center sticky left-0 z-2 shrink-0",
      isAdd ? "bg-diff-add-bg" : isDel ? "bg-diff-remove-bg" : "bg-surface"
    )}
  >
    {/* Old Line Number */}
    <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
      {oldLineno ?? ""}
    </span>

    {/* New Line Number */}
    <span className="w-11 text-tertiary select-none text-right pr-2 shrink-0">
      {newLineno ?? ""}
    </span>

    {/* Origin Sign (+, -, ' ') */}
    <span
      className={clsx(
        "w-5 select-none text-center shrink-0",
        isModifiedLine ? "font-bold" : "font-normal"
      )}
    >
      {isAdd ? "+" : isDel ? "-" : " "}
    </span>
  </div>
);
