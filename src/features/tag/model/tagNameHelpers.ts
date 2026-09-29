/**
 * Sanitizes a user-typed tag name by replacing runs of whitespace with a
 * dash and stripping characters Git forbids in a ref name.
 */
export function sanitizeTagName(value: string): string {
  return value.replace(/\s+/g, "-").replace(/[~^:?*[\\@{}]/g, "");
}
