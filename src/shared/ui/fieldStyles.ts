export type FieldSize = "sm" | "md";

/** Classes shared by `Input` and `Textarea`. */
export const FIELD_BASE =
  "w-full bg-window text-primary border rounded-md text-xs placeholder:text-tertiary " +
  "outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const FIELD_SIZE: Record<FieldSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-3 py-2",
};

export function fieldBorder(invalid: boolean): string {
  return invalid
    ? "border-diff-remove-text focus:border-diff-remove-text"
    : "border-border-subtle focus:border-accent";
}
