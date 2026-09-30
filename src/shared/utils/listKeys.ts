// React keys for lists whose items have no id of their own. Parameters are
// structural so `shared/` does not depend on `ipc/` types.

/** Key for a diff hunk: no two hunks in one file diff share both start positions. */
export function hunkKey(hunk: { old_start: number; new_start: number }): string {
  return `${hunk.old_start}:${hunk.new_start}`;
}

/**
 * Key for a line within one hunk. Context lines carry both numbers, added
 * lines only the new one, deleted lines only the old one, and both counters
 * only increase inside a hunk, so the pair is unique.
 */
export function diffLineKey(line: { old_lineno: number | null; new_lineno: number | null }): string {
  return `${line.old_lineno ?? "-"}:${line.new_lineno ?? "-"}`;
}

/**
 * Pairs each word diff token with its character offset in the rendered line.
 * Tokens are never empty, so offsets are unique and stable for a given text.
 */
export function withOffsetKeys<T extends { text: string }>(
  tokens: readonly T[]
): Array<{ token: T; key: number }> {
  let offset = 0;
  return tokens.map((token) => {
    const key = offset;
    offset += token.text.length;
    return { token, key };
  });
}
