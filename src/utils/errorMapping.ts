import { getTranslation } from "../i18n";

export interface FriendlyError {
  title: string;
  message: string;
  actionHint?: string;
  rawError?: string;
}

export function mapGitError(
  error: unknown,
  tParam?: ReturnType<typeof getTranslation>
): FriendlyError {
  const t = tParam ?? getTranslation();
  const raw = error instanceof Error ? error.message : String(error);
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

  if (
    lower.includes("checkout_conflict") ||
    lower.includes("local changes would be overwritten")
  ) {
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