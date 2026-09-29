interface CommitActionTargetCardProps {
  label: string;
  targetCommit: {
    id: string;
    short_id: string;
    summary: string;
    author: string;
    time?: string;
  };
}

/** Target commit summary card shown at the top of the cherry-pick/revert modals. */
export function CommitActionTargetCard({ label, targetCommit }: CommitActionTargetCardProps) {
  return (
    <div className="bg-window px-3 py-2.5 rounded-md border border-border-subtle flex flex-col gap-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-secondary text-[11px] font-medium">{label}</span>
        <span className="font-mono text-primary font-semibold text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
          {targetCommit.short_id || targetCommit.id.substring(0, 7)}
        </span>
      </div>
      <div className="font-medium text-primary line-clamp-2" title={targetCommit.summary}>
        {targetCommit.summary}
      </div>
      <div className="flex items-center justify-between text-[11px] text-tertiary">
        <span>{targetCommit.author}</span>
        {targetCommit.time && <span>{targetCommit.time}</span>}
      </div>
    </div>
  );
}
