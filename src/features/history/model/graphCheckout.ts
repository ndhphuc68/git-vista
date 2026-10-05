import { type GraphCommitNode } from "../../../ipc/bindings.generated";
import { localNameOfRemoteBranch } from "../../../shared/utils/git";
import { REF_TYPE } from "../../../domain/enums";

/**
 * The local branch HEAD lands on after checking out `name` from a graph pill.
 * A remote-tracking pill such as `origin/feature` switches to the local
 * `feature`; the pill types come from the refs of the loaded commits.
 */
export function graphCheckedOutBranchName(
  name: string,
  commits: Pick<GraphCommitNode, "refs">[]
): string {
  const matching = commits.flatMap((commit) => commit.refs).filter((ref) => ref.name === name);
  const isRemoteOnly =
    matching.some((ref) => ref.ref_type === REF_TYPE.REMOTE) &&
    !matching.some((ref) => ref.ref_type !== REF_TYPE.REMOTE);
  return isRemoteOnly ? localNameOfRemoteBranch(name) : name;
}
