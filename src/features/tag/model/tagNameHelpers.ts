import { sanitizeRefName } from "../../../shared/utils/git";

/**
 * Sanitizes a user-typed tag name by replacing runs of whitespace with a
 * dash and stripping characters Git forbids in a ref name.
 *
 * Thin alias over the shared `sanitizeRefName` (also used by the branch
 * feature), kept so existing importers and tests do not need to change.
 */
export function sanitizeTagName(value: string): string {
  return sanitizeRefName(value);
}
