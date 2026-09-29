/**
 * Commit HEAD points at, used as the default target when creating a tag from
 * the sidebar's TAGS header. Falls back to the first local branch's commit
 * when none is flagged as HEAD yet (e.g. right after the branches query
 * settles but before the current branch is known).
 */
import { type BranchItem } from "../../../ipc/bindings.generated";

export function findHeadCommitId(localBranches: BranchItem[]): string {
  return (
    localBranches.find((branch) => branch.is_head)?.target_commit_id ||
    localBranches[0]?.target_commit_id ||
    ""
  );
}
