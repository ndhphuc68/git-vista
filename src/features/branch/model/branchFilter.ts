/**
 * Case-insensitive name filter shared by the local and remote branch lists in
 * the sidebar's search box.
 */
import { type BranchItem } from "../../../ipc/bindings.generated";

export function filterBranchesByName(branches: BranchItem[], search: string): BranchItem[] {
  return branches.filter((branch) => branch.name.toLowerCase().includes(search.toLowerCase()));
}
