import React from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "../../../i18n";
import { Checkbox, Textarea } from "../../../shared/ui";

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
        <Checkbox
          checked={isAnnotated}
          onChange={(e) => onIsAnnotatedChange(e.target.checked)}
          disabled={disabled}
          aria-label={t.modals.createTag.annotatedLabel}
        />
        <span>{t.modals.createTag.annotatedLabel}</span>
      </label>

      {isAnnotated && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tag-message-input" className="text-xs font-medium text-primary">
            {t.modals.createTag.messageLabel}
          </label>
          <Textarea
            id="tag-message-input"
            aria-label={t.modals.createTag.messageLabel}
            placeholder={t.modals.createTag.messagePlaceholder}
            value={message}
            onChange={onMessageChange}
            disabled={disabled}
            rows={3}
          />
        </div>
      )}
    </>
  );
};
