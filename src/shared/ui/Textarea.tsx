import React from "react";
import clsx from "clsx";
import { FIELD_BASE, FIELD_SIZE, fieldBorder, type FieldSize } from "./fieldStyles";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: FieldSize;
  mono?: boolean;
  invalid?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

/** Shared multi-line text field; same look as `Input`, vertically resizable. */
export const Textarea: React.FC<TextareaProps> = ({
  size = "sm",
  mono = false,
  invalid = false,
  className,
  ...rest
}) => (
  <textarea
    aria-invalid={invalid || undefined}
    className={clsx(
      FIELD_BASE,
      FIELD_SIZE[size],
      fieldBorder(invalid),
      "resize-y",
      mono ? "font-mono" : "font-sans",
      className
    )}
    {...rest}
  />
);
