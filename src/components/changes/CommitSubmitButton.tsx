import React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Button } from "../../shared/ui";

export interface CommitSubmitButtonProps {
  canCommit: boolean;
  submitting: boolean;
  isLoading: boolean;
  isAmend: boolean;
  stagedCount: number;
  onSubmit: () => void;
}

/** The commit form's submit button, its label depending on amend/loading state. */
export const CommitSubmitButton: React.FC<CommitSubmitButtonProps> = ({
  canCommit,
  submitting,
  isLoading,
  isAmend,
  stagedCount,
  onSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <Button data-testid="commit-button" disabled={!canCommit} onClick={onSubmit} className="w-full">
      {submitting || isLoading ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          <span>{t.commit.saving}</span>
        </>
      ) : isAmend ? (
        <span>{t.commit.amendCommitAdvanced}</span>
      ) : (
        <span>{t.commit.commitAdvanced.replace("{count}", String(stagedCount))}</span>
      )}
    </Button>
  );
};
