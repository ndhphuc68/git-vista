import React from "react";
import clsx from "clsx";
import { FIELD_BASE, FIELD_SIZE, fieldBorder, type FieldSize } from "./fieldStyles";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** `sm` for dense modal forms, `md` for roomier settings forms. */
  size?: FieldSize;
  /** Monospace text, for SHAs, URLs, tokens and revisions. */
  mono?: boolean;
  /** Shows the error border and sets `aria-invalid`. */
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Shared single-line text field. Knows nothing about Git-specific business
 * logic — everything comes in through props. `className` is for layout only
 * (width, flex, extra padding for an icon); it must not override colors.
 */
export const Input: React.FC<InputProps> = ({
  size = "sm",
  mono = false,
  invalid = false,
  type = "text",
  className,
  ...rest
}) => (
  <input
    type={type}
    aria-invalid={invalid || undefined}
    className={clsx(
      FIELD_BASE,
      FIELD_SIZE[size],
      fieldBorder(invalid),
      mono && "font-mono",
      className
    )}
    {...rest}
  />
);
