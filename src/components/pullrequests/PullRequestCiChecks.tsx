import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { CHECK_STATUS } from "../../domain/enums";
import { type CheckRunItem } from "../../ipc/githubApi";

interface PullRequestCiChecksProps {
  checkRuns: CheckRunItem[];
  t: Translations;
}

/** CI check-run summary; renders nothing when there are no check runs. */
export const PullRequestCiChecks: React.FC<PullRequestCiChecksProps> = ({ checkRuns, t }) => {
  if (checkRuns.length === 0) return null;
  return (
    <div className="p-3 bg-surface-header/40 border border-border-subtle rounded-xl space-y-2">
      <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
        <CheckCircle2 size={13} className="text-link" />
        <span>{t.pullRequests.ciStatus}</span>
      </div>
      <div className="space-y-1.5">
        {checkRuns.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface border border-border-subtle"
          >
            <div className="flex items-center gap-2 min-w-0">
              {c.status === CHECK_STATUS.SUCCESS && (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              )}
              {c.status === CHECK_STATUS.FAILURE && (
                <XCircle size={13} className="text-red-500 shrink-0" />
              )}
              {(c.status === CHECK_STATUS.IN_PROGRESS || c.status === CHECK_STATUS.QUEUED) && (
                <Clock size={13} className="text-amber-500 shrink-0" />
              )}
              <span className="truncate text-secondary font-mono text-[11px]">{c.name}</span>
            </div>

            {c.details_url && (
              <a
                href={c.details_url}
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline text-[11px] shrink-0 ml-2"
              >
                Details
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
