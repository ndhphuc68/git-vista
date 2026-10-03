export type FieldSize = "sm" | "md" | "lg";

/** Classes shared by `Input` and `Textarea`. */
export const FIELD_BASE =
  "w-full bg-window text-primary border rounded-md placeholder:text-tertiary " +
  "outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const FIELD_SIZE: Record<FieldSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3 py-2 text-xs",
  lg: "px-3.5 py-2.5 min-h-12 text-sm",
};

export function fieldBorder(invalid: boolean): string {
  return invalid
    ? "border-diff-remove-text focus:border-diff-remove-text"
    : "border-border-subtle focus:border-accent";
}
