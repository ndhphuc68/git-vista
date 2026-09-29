/**
 * Finds a remote by name in the loaded remotes list, or synthesizes a
 * minimal placeholder when it isn't loaded yet (e.g. right after the tree
 * renders but before the remotes query has settled).
 */
import { type RemoteItem } from "../../../ipc/bindings.generated";

export function findRemoteOrPlaceholder(
  remotesList: RemoteItem[],
  name: string,
  branchCount: number
): RemoteItem {
  return (
    remotesList.find((remote) => remote.name === name) || {
      name,
      fetch_url: null,
      push_url: null,
      branch_count: branchCount,
      is_default: false,
    }
  );
}
