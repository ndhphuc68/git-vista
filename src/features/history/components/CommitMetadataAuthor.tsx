import { Calendar, Clock, Mail, UserCheck } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { AuthorAvatar } from "./AuthorAvatar";

interface CommitMetadataAuthorProps {
  authorName: string;
  authorEmail: string | null | undefined;
  displayTime: string;
  exactDateTime: string;
}

/** Author avatar, name, email and timestamps row. */
export function CommitMetadataAuthor({
  authorName,
  authorEmail,
  displayTime,
  exactDateTime,
}: CommitMetadataAuthorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 pt-2.5 border-t border-border-subtle/70">
      <div className="relative shrink-0">
        <AuthorAvatar
          name={authorName}
          email={authorEmail}
          size={40}
          withRing
          className="text-sm shadow-sm"
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center shadow-2xs"
          title={t.diff.authorTitle}
        >
          <UserCheck size={9} className="text-white stroke-[3]" />
        </div>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-sm text-primary truncate leading-tight">
            {authorName}
          </span>
          <div
            className="flex items-center gap-1 text-[10px] text-accent font-semibold bg-accent-subtle/80 px-1.5 py-0.5 rounded border border-accent/20 shrink-0"
            title={exactDateTime}
          >
            <Clock size={10} className="shrink-0" />
            <span>{displayTime}</span>
          </div>
        </div>

        {authorEmail && (
          <span className="text-[11px] text-tertiary truncate leading-tight flex items-center gap-1 font-mono mt-0.5">
            <Mail size={10} className="shrink-0 opacity-70" />
            <span className="truncate">{authorEmail}</span>
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
  );
}
