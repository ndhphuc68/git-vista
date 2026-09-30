/**
 * Pure logic for `check-lint-suppressions.mjs`, kept separate so it can be
 * unit tested without touching the file system.
 */

/**
 * The only suppression comments allowed in the repo, per file. Each one hides
 * an `any` in a mocked mutation variable. Remove an entry when you type that
 * mock properly; never add one.
 */
export const SUPPRESSION_BASELINE = {
  "src/features/branch/api/useBranchMutations.test.ts": 1,
  "src/features/remote/api/useRemoteMutations.test.ts": 1,
  "src/features/stash/api/useStashMutations.test.ts": 1,
};

/** Matches `eslint-disable`, `-line` and `-next-line`, and the oxlint spellings. */
const SUPPRESSION = /\b(?:eslint|oxlint)-disable(?:-next-line|-line)?\b/g;

export function countSuppressions(content) {
  return content.match(SUPPRESSION)?.length ?? 0;
}

/** Files whose count differs from the baseline, in either direction. */
export function findSuppressionViolations(counts, baseline) {
  const files = new Set([...Object.keys(counts), ...Object.keys(baseline)]);
  const violations = [];
  for (const file of [...files].sort()) {
    const found = counts[file] ?? 0;
    const allowed = baseline[file] ?? 0;
    if (found !== allowed) violations.push({ file, found, allowed });
  }
  return violations;
}
