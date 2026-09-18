import { getTranslation } from "../i18n";

export interface FriendlyError {
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

export function mapGitError(
  error: unknown,
  tParam?: ReturnType<typeof getTranslation>
): FriendlyError {
  const t = tParam ?? getTranslation();
  const raw = errorDetails(error);
  const lower = raw.toLowerCase();

  if (lower.includes("authentication failed") || lower.includes("permission denied")) {
    return {
      title: t.errors.authFailedTitle,
      message: t.errors.authFailedMessage,
      actionHint: t.errors.authFailedHint,
      rawError: raw,
    };
  }

  if (
    lower.includes("rejected") ||
    lower.includes("fetch first") ||
    lower.includes("non-fast-forward")
  ) {
    return {
      title: t.errors.remoteNewCommitsTitle,
      message: t.errors.remoteNewCommitsMessage,
      actionHint: t.errors.remoteNewCommitsHint,
      rawError: raw,
    };
  }

  if (lower.includes("checkout_conflict") || lower.includes("local changes would be overwritten")) {
    return {
      title: t.errors.checkoutConflictTitle,
      message: t.errors.checkoutConflictMessage,
      actionHint: t.errors.checkoutConflictHint,
      rawError: raw,
    };
  }

  if (
    lower.includes("could not resolve host") ||
    lower.includes("connection timed out") ||
    lower.includes("network is unreachable")
  ) {
    return {
      title: t.errors.networkErrorTitle,
      message: t.errors.networkErrorMessage,
      actionHint: t.errors.networkErrorHint,
      rawError: raw,
    };
  }

  return {
    title: t.errors.genericTitle,
    message: raw,
    rawError: raw,
  };
}
