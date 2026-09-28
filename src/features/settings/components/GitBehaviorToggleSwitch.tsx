import React from "react";

export interface GitBehaviorToggleSwitchProps {
  checked: boolean;
  testId: string;
  ariaLabel: string;
  onClick: () => void;
}

/** Toggle switch styled to match the rest of the settings UI. */
export const GitBehaviorToggleSwitch: React.FC<GitBehaviorToggleSwitchProps> = ({
  checked,
  testId,
  ariaLabel,
  onClick,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-testid={testId}
    onClick={onClick}
    aria-label={ariaLabel}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
      checked ? "bg-accent" : "bg-border-strong"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);
