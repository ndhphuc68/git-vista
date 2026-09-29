import clsx from "clsx";
import { getTypeBadgeStyle } from "../model/commitDetails";
import type { parseCommitMessage } from "../model/commitDetails";

interface CommitMetadataSubjectProps {
  parsedMsg: ReturnType<typeof parseCommitMessage>;
  fallbackMessage: string;
}

/** Subject line with its optional Conventional Commits type badge, plus the body. */
export function CommitMetadataSubject({ parsedMsg, fallbackMessage }: CommitMetadataSubjectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2 flex-wrap">
        {parsedMsg.type && (
          <span
            className={clsx(
              "px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase border shadow-2xs shrink-0",
              getTypeBadgeStyle(parsedMsg.type)
            )}
          >
            {parsedMsg.type}
            {parsedMsg.scope ? `(${parsedMsg.scope})` : ""}
          </span>
        )}
        <h3 className="text-sm font-bold text-primary leading-snug break-words flex-1">
          {parsedMsg.cleanSubject || parsedMsg.fullSubject || fallbackMessage}
        </h3>
      </div>

      {parsedMsg.body && (
        <div className="text-xs text-secondary leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap bg-window/60 p-2.5 rounded-md border border-border-subtle font-sans border-l-2 border-l-accent mt-1">
          {parsedMsg.body}
        </div>
      )}
    </div>
  );
}
