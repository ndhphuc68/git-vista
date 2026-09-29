import React from "react";
import { Check } from "lucide-react";

export interface GitBehaviorPullStrategyOptionProps {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

/** Selectable card for one pull-strategy choice: icon, content, and a check mark when selected. */
export const GitBehaviorPullStrategyOption: React.FC<GitBehaviorPullStrategyOptionProps> = ({
  selected,
  disabled,
  onClick,
  icon: Icon,
  children,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
      selected
        ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
        : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
    }`}
  >
    <Icon className={`w-5 h-5 mt-0.5 ${selected ? "text-accent" : "text-secondary"}`} />
    <div className="flex-1">{children}</div>
    {selected && <Check size={16} className="text-accent mt-0.5" />}
  </button>
);
