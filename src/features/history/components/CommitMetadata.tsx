import { useMemo } from "react";
import clsx from "clsx";
import { Calendar, Clock, Mail, UserCheck } from "lucide-react";
import { useTranslation } from "../../../i18n";
import type { CommitDetails } from "../api/useCommitDetails";
import {
  parseCommitMessage,
  getTypeBadgeStyle,
  getAuthorAvatarStyle,
  getAuthorInitials,
  formatRelativeTime,
  formatExactDateTime,
} from "../model/commitDetails";

export function CommitMetadata({ details }: { details: CommitDetails }) {
  const { t } = useTranslation();
  // Commit message parsed with conventional commits & body
  const parsedMsg = useMemo(() => {
    return parseCommitMessage(details?.full_message || "");
  }, [details?.full_message]);

  const authorAvatarStyle = useMemo(() => {
    return getAuthorAvatarStyle(details?.author_name || "");
  }, [details?.author_name]);

  const authorInitials = useMemo(() => {
    return getAuthorInitials(details?.author_name || "");
  }, [details?.author_name]);

  const relativeTime = useMemo(() => {
    return details ? formatRelativeTime(details.author_timestamp_sec, t.diff.time) : "";
  }, [details, t.diff.time]);

  const exactDateTime = useMemo(() => {
    return details ? formatExactDateTime(details.author_timestamp_sec) : "";
  }, [details]);

  return (
    <div className="p-3.5 border-b border-border-subtle bg-surface flex flex-col gap-3 shadow-2xs">
      {/* Subject with Conventional Commits Type Badge */}
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
            {parsedMsg.cleanSubject || parsedMsg.fullSubject || details.full_message}
          </h3>
        </div>

        {/* Optional body */}
        {parsedMsg.body && (
          <div className="text-xs text-secondary leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap bg-window/60 p-2.5 rounded-md border border-border-subtle font-sans border-l-2 border-l-accent mt-1">
            {parsedMsg.body}
          </div>
        )}
      </div>

      {/* Author & Timestamp Section */}
      <div className="flex items-center gap-3 pt-2.5 border-t border-border-subtle/70">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 select-none",
              authorAvatarStyle.bg,
              authorAvatarStyle.ring
            )}
          >
            {authorInitials}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center shadow-2xs"
            title={t.diff.authorTitle}
          >
            <UserCheck size={9} className="text-white stroke-[3]" />
          </div>
        </div>

        {/* Author Meta */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm text-primary truncate leading-tight">
              {details.author_name}
            </span>
            <div
              className="flex items-center gap-1 text-[10px] text-accent font-semibold bg-accent-subtle/80 px-1.5 py-0.5 rounded border border-accent/20 shrink-0"
              title={exactDateTime}
            >
              <Clock size={10} className="shrink-0" />
              <span>{relativeTime}</span>
            </div>
          </div>

          {details.author_email && (
            <span className="text-[11px] text-tertiary truncate leading-tight flex items-center gap-1 font-mono mt-0.5">
              <Mail size={10} className="shrink-0 opacity-70" />
              <span className="truncate">{details.author_email}</span>
            </span>
          )}

          <div
            className="flex items-center gap-1 text-[11px] text-secondary font-mono mt-0.5"
            title={t.diff.commitTimeTitle}
          >
            <Calendar size={11} className="shrink-0 text-tertiary" />
            <span className="truncate">{exactDateTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
