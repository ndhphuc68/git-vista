import { type BranchListResult } from "../../../ipc/bindings.generated";
import { localNameOfRemoteBranch } from "../../../shared/utils/git";

/**
 * The local branch HEAD lands on after checking out `name`. Checking out a
 * remote-tracking branch such as `origin/feature` switches to (creating it if
 * needed) the local `feature`, mirroring how the backend resolves the target.
 */
export function checkedOutBranchName(
  name: string,
  branchData: BranchListResult | undefined
): string {
  if (!branchData || branchData.local.some((branch) => branch.name === name)) return name;
  if (!branchData.remote.some((branch) => branch.name === name)) return name;
  return localNameOfRemoteBranch(name);
}

/**
 * How far the existing local branch lags behind `name` when `name` is the
 * remote-tracking branch it tracks. Checking out `origin/feature` then lands on
 * the older local `feature`, which the user should hear about; 0 otherwise.
 */
export function commitsBehindRemote(
  name: string,
  branchData: BranchListResult | undefined
): number {
  if (!branchData || branchData.local.some((branch) => branch.name === name)) return 0;
  const localName = localNameOfRemoteBranch(name);
  const local = branchData.local.find((branch) => branch.name === localName);
  return local && local.upstream === name ? local.behind : 0;
}
