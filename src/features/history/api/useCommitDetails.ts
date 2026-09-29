import { useQuery } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import { invokeCommand } from "../../../ipc/client";

export type CommitDetails = Awaited<ReturnType<typeof invokeCommand.getCommitDetails>>;
export type CommitFile = CommitDetails["files"][number];

export function useCommitDetails(repoPath: string | undefined, commitId: string | null) {
  return useQuery({
    queryKey: qk.commitDetails(repoPath ?? "", commitId ?? ""),
    queryFn: () => invokeCommand.getCommitDetails(repoPath!, commitId!),
    enabled: Boolean(repoPath !== undefined && commitId),
  });
}
