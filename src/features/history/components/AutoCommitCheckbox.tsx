interface AutoCommitCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
  label: string;
  description: string;
}

/** Shared auto-commit checkbox + description used by the cherry-pick/revert modals. */
export function AutoCommitCheckbox({
  checked,
  onChange,
  disabled,
  label,
  description,
}: AutoCommitCheckboxProps) {
  return (
    <div className="flex flex-col gap-1 mt-1">
      <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={label}
          className="accent-accent cursor-pointer rounded-sm"
        />
        <span className="font-medium">{label}</span>
      </label>
      <span className="text-[11px] text-secondary pl-6">{description}</span>
    </div>
  );
}
