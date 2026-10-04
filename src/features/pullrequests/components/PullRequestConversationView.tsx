import React from "react";
import clsx from "clsx";
import { CheckCircle2, XCircle, Clock, MinusCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "../../../i18n";
import type { PullRequestDetail, GitHubUserSummary, CheckRunItem } from "../../../ipc/githubApi";

export interface PullRequestConversationViewProps {
  detail: PullRequestDetail;
  className?: string;
}

const UserAvatarItem: React.FC<{ user: GitHubUserSummary }> = ({ user }) => (
  <div className="flex items-center gap-2 min-w-0">
    {user.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.login}
        className="w-5 h-5 rounded-full object-cover shrink-0"
      />
    ) : (
      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center font-bold text-[10px] text-accent shrink-0">
        {user.login?.charAt(0).toUpperCase() || "?"}
      </div>
    )}
    <span className="text-xs text-primary font-medium truncate">@{user.login}</span>
  </div>
);

const CheckRunStatusIcon: React.FC<{ status: CheckRunItem["status"] }> = ({ status }) => {
  if (status === "success") {
    return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" aria-label="success" />;
  }
  if (status === "failure") {
    return <XCircle size={14} className="text-rose-500 shrink-0" aria-label="failure" />;
  }
  if (status === "in_progress" || status === "queued") {
    return <Clock size={14} className="text-amber-500 shrink-0" aria-label={status} />;
  }
  return <MinusCircle size={14} className="text-tertiary shrink-0" aria-label="neutral" />;
};

const CheckRunRow: React.FC<{
  run: CheckRunItem;
  detailsLabel: string;
}> = ({ run, detailsLabel }) => (
  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-surface-header/40 border border-border-subtle">
    <div className="flex items-center gap-2 min-w-0">
      <CheckRunStatusIcon status={run.status} />
      <span className="truncate text-secondary font-mono text-[11px]">{run.name}</span>
    </div>
    {run.details_url && (
      <a
        href={run.details_url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${run.name} ${detailsLabel}`}
        className="inline-flex items-center gap-1 text-accent hover:underline text-xs shrink-0 ml-2"
      >
        <span>{detailsLabel}</span>
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    )}
  </div>
);

const DescriptionBox: React.FC<{ body?: string }> = ({ body }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
        {t.pullRequests.description}
      </h3>
      <div className="bg-surface rounded-xl border border-border-subtle p-4 text-sm text-primary whitespace-pre-wrap font-sans leading-relaxed min-h-20">
        {body && body.trim() ? (
          body
        ) : (
          <span className="text-tertiary italic">{t.pullRequests.noDescription}</span>
        )}
      </div>
    </div>
  );
};

const CiChecksSection: React.FC<{ checkRuns: CheckRunItem[] }> = ({ checkRuns }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
        <CheckCircle2 size={14} className="text-accent shrink-0" aria-hidden="true" />
        <span>{t.pullRequestsScreen.checks.title}</span>
      </div>

      {checkRuns.length === 0 ? (
        <p className="text-xs text-tertiary italic p-4 bg-surface rounded-xl border border-border-subtle">
          {t.pullRequestsScreen.checks.noChecks}
        </p>
      ) : (
        <div className="space-y-2 bg-surface rounded-xl border border-border-subtle p-3">
          {checkRuns.map((run) => (
            <CheckRunRow
              key={run.name}
              run={run}
              detailsLabel={t.pullRequestsScreen.checks.details}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MetaSidebar: React.FC<{ detail: PullRequestDetail }> = ({ detail }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Reviewers */}
      <div className="bg-surface rounded-xl border border-border-subtle p-4 space-y-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          {t.pullRequestsScreen.meta.reviewers}
        </h3>
        {detail.requested_reviewers.length === 0 ? (
          <p className="text-xs text-tertiary italic">{t.pullRequestsScreen.meta.noReviewers}</p>
        ) : (
          <div className="space-y-2">
            {detail.requested_reviewers.map((user) => (
              <UserAvatarItem key={user.login} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Assignees */}
      <div className="bg-surface rounded-xl border border-border-subtle p-4 space-y-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          {t.pullRequestsScreen.meta.assignees}
        </h3>
        {detail.assignees.length === 0 ? (
          <p className="text-xs text-tertiary italic">{t.pullRequestsScreen.meta.noAssignees}</p>
        ) : (
          <div className="space-y-2">
            {detail.assignees.map((user) => (
              <UserAvatarItem key={user.login} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="bg-surface rounded-xl border border-border-subtle p-4 space-y-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          {t.pullRequestsScreen.meta.labels}
        </h3>
        {detail.pr.labels.length === 0 ? (
          <p className="text-xs text-tertiary italic">{t.pullRequestsScreen.meta.noLabels}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {detail.pr.labels.map((label) => (
              <span
                key={label.name}
                style={{
                  backgroundColor: `#${label.color}20`,
                  borderColor: `#${label.color}50`,
                  color: `#${label.color}`,
                }}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PullRequestConversationView: React.FC<PullRequestConversationViewProps> = ({
  detail,
  className,
}) => {
  return (
    <div className={clsx("flex flex-col lg:flex-row gap-6 items-start", className)}>
      <div className="flex-1 min-w-0 space-y-6 w-full">
        <DescriptionBox body={detail.body} />
        <CiChecksSection checkRuns={detail.check_runs} />
      </div>
      <MetaSidebar detail={detail} />
    </div>
  );
};
