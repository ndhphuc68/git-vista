import { type BranchListResult } from "../../../ipc/bindings.generated";

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
  const slash = name.indexOf("/");
  return slash === -1 ? name : name.slice(slash + 1);
}
