import { SHORT_SHA_LENGTH } from "../../domain/constants/ui";

/** Shortens a commit SHA for display, e.g. "a1b2c3d4e5..." becomes "a1b2c3d". */
export function shortSha(sha: string): string {
  return sha.slice(0, SHORT_SHA_LENGTH);
}
