import { sanitizeRefName } from "../../../shared/utils/git";

/**
 * Sanitizes a branch name as the user types it: spaces become "-" and the
 * characters Git disallows in a ref name are stripped. Shared by the create
 * and rename branch modals so both forms behave identically.
 *
 * Thin alias over the shared `sanitizeRefName` (also used by the tag
 * feature), kept so existing importers and tests do not need to change.
 */
export function sanitizeBranchName(value: string): string {
  return sanitizeRefName(value);
}
