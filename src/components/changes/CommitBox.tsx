import React from "react";
import type { CommitDetails } from "../../ipc/bindings.generated";
import { useCommitBox } from "./useCommitBox";
import { CommitBoxHeader } from "./CommitBoxHeader";
import { CommitSummaryInput } from "./CommitSummaryInput";
import { CommitSubmitButton } from "./CommitSubmitButton";

export interface CommitBoxProps {
  repoPath: string;
  stagedCount: number;
  lastCommitMessage?: string;
  onCommit?: (
    summary: string,
    description?: string,
    amend?: boolean
  ) => Promise<CommitDetails | void>;
  onSuccess?: () => void;
  isLoading?: boolean;
}

export const CommitBox: React.FC<CommitBoxProps> = (props) => {
  const { stagedCount, isLoading = false } = props;
  const {
    t,
    mode,
    summary,
    setSummary,
    description,
    setDescription,
    isAmend,
    submitting,
    shortcutHint,
    isOver72,
    canCommit,
    handleAmendToggle,
    handleSubmit,
    handleKeyDown,
  } = useCommitBox(props);

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface border-t border-border-subtle">
      <CommitBoxHeader summaryLength={summary.length} isOver72={isOver72} />

      <CommitSummaryInput
        summary={summary}
        onSummaryChange={setSummary}
        onKeyDown={handleKeyDown}
        isOver72={isOver72}
      />

      <textarea
        data-testid="commit-description-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.commit.descPlaceholder}
        rows={3}
        className="w-full px-2 py-1.5 bg-window border border-border-subtle focus:border-accent rounded-sm text-xs text-primary resize-y outline-none font-inherit box-border transition-colors"
      />

      <div className="flex items-center justify-between mt-0.5">
        <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer select-none">
          <input
            type="checkbox"
            data-testid="amend-checkbox"
            checked={isAmend}
            onChange={handleAmendToggle}
            className="cursor-pointer"
          />
          <span>{mode === "simple" ? t.commit.amendSimple : t.commit.amendAdvanced}</span>
        </label>

        <span className="text-[10px] text-tertiary">{shortcutHint}</span>
      </div>

      <CommitSubmitButton
        canCommit={canCommit}
        submitting={submitting}
        isLoading={isLoading}
        isAmend={isAmend}
        mode={mode}
        stagedCount={stagedCount}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
