/**
 * Thin wrappers over the git-config IPC commands used by git behavior
 * settings. This is the only module in `features/settings` allowed to import
 * `ipc/`; `hooks/useGitBehaviorSettings` composes these functions instead of
 * calling `invokeCommand` directly.
 */
import { invokeCommand } from "../../../ipc/client";
import type { GitConfigDto, ConfigScope } from "../../../ipc/client";

/** Read the git config for the given scope. Pass `null` for the global config. */
export function getGitConfig(repoPath: string | null): Promise<GitConfigDto> {
  return invokeCommand.getGitConfig(repoPath);
}

/** Write a single git config key at the given scope. */
export function setGitConfig(
  repoPath: string | null,
  scope: ConfigScope,
  key: string,
  value: string
): Promise<void> {
  return invokeCommand.setGitConfig(repoPath, scope, key, value);
}

/** Set (or clear, via `setGitConfig`) the repo-local `pull.rebase` override. */
export function setRepoPullRebase(repoPath: string, rebase: boolean): Promise<void> {
  return invokeCommand.setRepoPullRebase(repoPath, rebase);
}
