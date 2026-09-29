import { useMemo } from "react";
import { useTranslation } from "../../../i18n";
import type { CommitDetails } from "../api/useCommitDetails";
import {
  parseCommitMessage,
  getAuthorAvatarStyle,
  getAuthorInitials,
  formatRelativeTime,
  formatExactDateTime,
} from "../model/commitDetails";
import { CommitMetadataSubject } from "./CommitMetadataSubject";
import { CommitMetadataAuthor } from "./CommitMetadataAuthor";

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
      <CommitMetadataSubject parsedMsg={parsedMsg} fallbackMessage={details.full_message} />
      <CommitMetadataAuthor
        authorName={details.author_name}
        authorEmail={details.author_email}
        authorAvatarStyle={authorAvatarStyle}
        authorInitials={authorInitials}
        relativeTime={relativeTime}
        exactDateTime={exactDateTime}
      />
    </div>
  );
}
