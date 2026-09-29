/**
 * Sanitizes a branch name as the user types it: spaces become "-" and the
 * characters Git disallows in a ref name are stripped. Shared by the create
 * and rename branch modals so both forms behave identically.
 */
export function sanitizeBranchName(value: string): string {
  return value.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
}
