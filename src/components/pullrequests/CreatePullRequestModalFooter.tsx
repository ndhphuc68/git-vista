import React from "react";
import { AlertCircle, GitPullRequest } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { Button, Checkbox } from "../../shared/ui";

interface CreatePullRequestModalFooterProps {
  isDraft: boolean;
  onDraftChange: (checked: boolean) => void;
  error: string | null;
  submitting: boolean;
  title: string;
  onClose: () => void;
  t: Translations;
}

/** Draft toggle, error message and the cancel/submit action buttons. */
export const CreatePullRequestModalFooter: React.FC<CreatePullRequestModalFooterProps> = ({
  isDraft,
  onDraftChange,
  error,
  submitting,
  title,
  onClose,
  t,
}) => (
  <>
    {/* Draft PR Toggle */}
    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
      <Checkbox
        checked={isDraft}
        onChange={(e) => onDraftChange(e.target.checked)}
        disabled={submitting}
        aria-label={t.pullRequests.isDraft}
      />
      <span>{t.pullRequests.isDraft}</span>
    </label>

    {/* Error Message */}
    {error && (
      <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-lg text-diff-remove-text text-xs">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    )}

    {/* Action Buttons */}
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
      <Button variant="secondary" onClick={onClose} disabled={submitting} size="lg">
        {t.common.cancel}
      </Button>
      <Button type="submit" loading={submitting} disabled={!title.trim()} size="lg">
        {submitting ? (
          <span>{t.pullRequests.creating}</span>
        ) : (
          <>
            <GitPullRequest size={13} />
            <span>{t.pullRequests.submitCreate}</span>
          </>
        )}
      </Button>
    </div>
  </>
);
