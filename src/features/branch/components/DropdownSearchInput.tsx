import React from "react";
import { Search, X } from "lucide-react";

export interface DropdownSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** Search filter input styled for dropdown popovers matching GitVista design system. */
export const DropdownSearchInput: React.FC<DropdownSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Filter...",
  ariaLabel,
}) => (
  <div className="p-2 border-b border-border-subtle bg-surface/40 shrink-0">
    <div className="group relative flex items-center gap-2 bg-window focus-within:bg-window focus-within:ring-2 focus-within:ring-accent/20 border border-border-subtle focus-within:border-accent rounded-md px-2.5 py-1.5 transition-all duration-150 shadow-2xs">
      <Search
        size={13}
        className="text-tertiary group-focus-within:text-accent shrink-0 transition-colors pointer-events-none"
      />
      <input
        type="text"
        data-autofocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-xs text-primary placeholder:text-tertiary w-full leading-normal selection:bg-accent/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="p-0.5 text-tertiary hover:text-primary hover:bg-surface-hover rounded-full transition-colors flex items-center justify-center border-0 bg-transparent cursor-pointer shrink-0"
        >
          <X size={12} />
        </button>
      )}
    </div>
  </div>
);
