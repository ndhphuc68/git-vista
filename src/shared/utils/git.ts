import { SHORT_SHA_LENGTH } from "../../domain/constants/ui";

/** Shortens a commit SHA for display, e.g. "a1b2c3d4e5..." becomes "a1b2c3d". */
export function shortSha(sha: string): string {
  return sha.slice(0, SHORT_SHA_LENGTH);
}

/**
 * Sanitizes a user-typed ref name (branch or tag) as it is typed: runs of
 * whitespace become a single "-" and the characters Git disallows in a ref
 * name are stripped. Shared by the branch and tag create/rename forms so
 * both behave identically.
 */
export function sanitizeRefName(value: string): string {
  return value.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
}

/**
 * The local branch a remote-tracking branch checks out as: `origin/feature/x`
 * becomes `feature/x`. Only the first segment is the remote name, matching how
 * the backend resolves a remote checkout.
 */
export function localNameOfRemoteBranch(remoteBranch: string): string {
  const slash = remoteBranch.indexOf("/");
  return slash === -1 ? remoteBranch : remoteBranch.slice(slash + 1);
}
