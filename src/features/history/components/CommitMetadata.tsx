import { useMemo } from "react";
import { useFormatDate } from "../../../i18n";
import type { CommitDetails } from "../api/useCommitDetails";
import { parseCommitMessage, formatExactDateTime } from "../model/commitDetails";
import { CommitMetadataSubject } from "./CommitMetadataSubject";
import { CommitMetadataAuthor } from "./CommitMetadataAuthor";

export function CommitMetadata({ details }: { details: CommitDetails }) {
  const formatDate = useFormatDate();
  const displayTime = details ? formatDate(details.author_timestamp_sec) : "";

  // Commit message parsed with conventional commits & body
  const parsedMsg = useMemo(() => {
    return parseCommitMessage(details?.full_message || "");
  }, [details?.full_message]);

  const exactDateTime = useMemo(() => {
    return details ? formatExactDateTime(details.author_timestamp_sec) : "";
  }, [details]);

  return (
    <div className="p-3.5 border-b border-border-subtle bg-surface flex flex-col gap-3 shadow-2xs">
      <CommitMetadataSubject parsedMsg={parsedMsg} fallbackMessage={details.full_message} />
      <CommitMetadataAuthor
        authorName={details.author_name}
        authorEmail={details.author_email}
        displayTime={displayTime}
        exactDateTime={exactDateTime}
      />
    </div>
  );
}
