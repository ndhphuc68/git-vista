import React from "react";
import { AlertCircle, GitPullRequest, Loader2 } from "lucide-react";
import { type Translations } from "../../i18n/vi";

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
      <input
        type="checkbox"
        checked={isDraft}
        onChange={(e) => onDraftChange(e.target.checked)}
        disabled={submitting}
        aria-label={t.pullRequests.isDraft}
        className="accent-accent cursor-pointer rounded"
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
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="px-3.5 py-1.5 bg-transparent border border-border-subtle rounded-md text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
      >
        {t.common.cancel}
      </button>
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>{t.pullRequests.creating}</span>
          </>
        ) : (
          <>
            <GitPullRequest size={13} />
            <span>{t.pullRequests.submitCreate}</span>
          </>
        )}
      </button>
    </div>
  </>
);
