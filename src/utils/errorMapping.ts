import { getTranslation } from "../i18n";

export interface FriendlyError {
  /** Set when the error matched a known failure, so callers can offer a fix for it. */
  kind?: KnownErrorKind;
  title: string;
  message: string;
  actionHint?: string;
  rawError?: string;
}

function errorDetails(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    if ("message" in error) {
      if (typeof error.message === "string") return error.message;
      const message = error.message;
      if (
        message &&
        typeof message === "object" &&
        "stderr" in message &&
        typeof message.stderr === "string"
      ) {
        const code = "code" in message ? message.code : undefined;
        return typeof code === "number" ? `${message.stderr}\n(exit code ${code})` : message.stderr;
      }
    }
    try {
      return JSON.stringify(error);
    } catch {
      /* Fall back for circular objects. */
    }
  }
  return String(error);
}

export type KnownErrorKind =
  | "authFailed"
  | "remoteNewCommits"
  | "checkoutConflict"
  | "stashConflict"
  | "branchInWorktree"
  | "repoLocked"
  | "operationInProgress"
  | "networkError";

/**
 * Each known failure and the lowercase fragments that identify it, checked in
 * order: the first rule with a matching fragment wins. A kind's texts live in
 * `t.errors` as `<kind>Title`, `<kind>Message` and `<kind>Hint`.
 */
const KNOWN_ERRORS: ReadonlyArray<{ kind: KnownErrorKind; fragments: string[] }> = [
  { kind: "authFailed", fragments: ["authentication failed", "permission denied"] },
  { kind: "remoteNewCommits", fragments: ["rejected", "fetch first", "non-fast-forward"] },
  {
    kind: "checkoutConflict",
    fragments: ["checkout_conflict", "local changes would be overwritten"],
  },
  { kind: "stashConflict", fragments: ["stash_conflict"] },
  { kind: "branchInWorktree", fragments: ["branch_in_worktree"] },
  // A lock file left by another (or a crashed) Git process blocks the write.
  { kind: "repoLocked", fragments: ["index.lock", "index is locked", "failed to lock file"] },
  {
    kind: "operationInProgress",
    fragments: [
      "operation_in_progress",
      "operation is already in progress",
      "cannot switch branch while",
    ],
  },
  {
    kind: "networkError",
    fragments: ["could not resolve host", "connection timed out", "network is unreachable"],
  },
];

export function mapGitError(
  error: unknown,
  tParam?: ReturnType<typeof getTranslation>
): FriendlyError {
  const t = tParam ?? getTranslation();
  const raw = errorDetails(error);
  const lower = raw.toLowerCase();

  const known = KNOWN_ERRORS.find((rule) =>
    rule.fragments.some((fragment) => lower.includes(fragment))
  );
  if (known) {
    return {
      kind: known.kind,
      title: t.errors[`${known.kind}Title`],
      message: t.errors[`${known.kind}Message`],
      actionHint: t.errors[`${known.kind}Hint`],
      rawError: raw,
    };
  }

  return {
    title: t.errors.genericTitle,
    message: raw,
    rawError: raw,
  };
}
