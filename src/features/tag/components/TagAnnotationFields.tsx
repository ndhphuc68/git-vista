import React from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "../../../i18n";

export interface TagAnnotationFieldsProps {
  isAnnotated: boolean;
  onIsAnnotatedChange: (checked: boolean) => void;
  message: string;
  onMessageChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}

/**
 * The "annotated tag" checkbox and its conditional message textarea in
 * `CreateTagModal`. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const TagAnnotationFields: React.FC<TagAnnotationFieldsProps> = ({
  isAnnotated,
  onIsAnnotatedChange,
  message,
  onMessageChange,
  disabled,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none mt-1">
        <input
          type="checkbox"
          checked={isAnnotated}
          onChange={(e) => onIsAnnotatedChange(e.target.checked)}
          disabled={disabled}
          aria-label={t.modals.createTag.annotatedLabel}
          className="accent-accent cursor-pointer rounded-sm"
        />
        <span>{t.modals.createTag.annotatedLabel}</span>
      </label>

      {isAnnotated && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tag-message-input" className="text-xs font-medium text-primary">
            {t.modals.createTag.messageLabel}
          </label>
          <textarea
            id="tag-message-input"
            aria-label={t.modals.createTag.messageLabel}
            placeholder={t.modals.createTag.messagePlaceholder}
            value={message}
            onChange={onMessageChange}
            disabled={disabled}
            rows={3}
            className="bg-window text-primary border border-border-subtle rounded-sm px-3 py-1.5 text-xs outline-none focus:border-accent transition-colors w-full resize-none"
          />
        </div>
      )}
    </>
  );
};
