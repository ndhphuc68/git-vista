import React, { useRef } from "react";
import clsx from "clsx";
import { arrowStep, nextEnabledIndex } from "./segmentedControl.helpers";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  testId?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

/**
 * Shared single-choice segmented control (WAI-ARIA radiogroup). Arrow keys
 * move and select, skipping disabled options; only the selected option is
 * in the tab order.
 */
export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled = false,
  "data-testid": testId,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const disabledFlags = options.map((opt) => disabled || Boolean(opt.disabled));
  const focusIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = arrowStep(event.key);
    if (step === 0) return;
    event.preventDefault();
    const next = nextEnabledIndex(disabledFlags, index, step);
    if (next === -1 || !options[next]) return;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid={testId}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-header/60 p-0.5"
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={disabledFlags[index]}
            data-testid={opt.testId}
            onClick={() => onChange(opt.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "bg-surface text-primary shadow-xs" : "text-secondary hover:text-primary"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
