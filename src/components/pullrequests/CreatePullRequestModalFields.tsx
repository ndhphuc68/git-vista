import React, { type RefObject } from "react";
import { type Translations } from "../../i18n/vi";
import { Input, Textarea } from "../../shared/ui";

interface CreatePullRequestModalFieldsProps {
  titleInputRef: RefObject<HTMLInputElement | null>;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  submitting: boolean;
  t: Translations;
}

/** Title input and body textarea for the new pull request. */
export const CreatePullRequestModalFields: React.FC<CreatePullRequestModalFieldsProps> = ({
  titleInputRef,
  title,
  onTitleChange,
  body,
  onBodyChange,
  submitting,
  t,
}) => (
  <>
    {/* Title Input */}
    <div className="flex flex-col gap-1.5">
      <label htmlFor="pr-title-input" className="text-xs font-medium text-primary">
        {t.pullRequests.prTitle} <span className="text-red-500">*</span>
      </label>
      <Input
        ref={titleInputRef}
        data-autofocus
        id="pr-title-input"
        aria-label={t.pullRequests.prTitle}
        size="md"
        placeholder={t.pullRequests.prTitlePlaceholder}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        disabled={submitting}
      />
    </div>

    {/* Body Textarea */}
    <div className="flex flex-col gap-1.5">
      <label htmlFor="pr-body-input" className="text-xs font-medium text-primary">
        {t.pullRequests.prBody}
      </label>
      <Textarea
        id="pr-body-input"
        aria-label={t.pullRequests.prBody}
        rows={5}
        size="md"
        placeholder={t.pullRequests.prBodyPlaceholder}
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        disabled={submitting}
        className="leading-relaxed"
      />
    </div>
  </>
);
