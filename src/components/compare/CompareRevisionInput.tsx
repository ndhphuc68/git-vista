import React from "react";
import { Input } from "../../shared/ui";

interface CompareRevisionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

/** A single labeled revision text input, wired to the shared datalist for autocomplete. */
export const CompareRevisionInput: React.FC<CompareRevisionInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  ariaLabel,
}) => (
  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
    <span className="text-xs font-semibold text-secondary whitespace-nowrap">{label}:</span>
    <Input
      list="compare-revision-options"
      mono
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="flex-1"
    />
  </div>
);
