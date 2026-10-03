// Resolves an image URL for a commit author from their email address.
// GitHub noreply addresses map straight to the account avatar; every other
// address goes through Gravatar with `d=404`, so a missing Gravatar fails to
// load and the caller falls back to initials.

const GITHUB_NOREPLY_PATTERN = /^(?:(\d+)\+)?([^@\s]+)@users\.noreply\.github\.com$/i;

export function getGitHubNoreplyAvatarUrl(email: string, size: number): string | null {
  const match = GITHUB_NOREPLY_PATTERN.exec(email.trim());
  if (!match) return null;
  const [, userId, login] = match;
  if (userId) return `https://avatars.githubusercontent.com/u/${userId}?s=${size}`;
  return `https://github.com/${encodeURIComponent(login!)}.png?size=${size}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getGravatarUrl(email: string, size: number): Promise<string> {
  const hash = await sha256Hex(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}

const urlCache = new Map<string, Promise<string | null>>();

/** Cached per email and size so long commit lists hash each author once. */
export function resolveAuthorAvatarUrl(
  email: string | null | undefined,
  size: number
): Promise<string | null> {
  const trimmed = email?.trim();
  if (!trimmed) return Promise.resolve(null);
  const key = `${trimmed.toLowerCase()}|${size}`;
  let pending = urlCache.get(key);
  if (!pending) {
    const direct = getGitHubNoreplyAvatarUrl(trimmed, size);
    pending = direct ? Promise.resolve(direct) : getGravatarUrl(trimmed, size).catch(() => null);
    urlCache.set(key, pending);
  }
  return pending;
}

// URLs that already failed to load (e.g. Gravatar 404). Remembered for the
// session so virtualized rows that remount do not request them again.
const failedUrls = new Set<string>();

export function markAvatarUrlFailed(url: string): void {
  failedUrls.add(url);
}

export function isAvatarUrlFailed(url: string): boolean {
  return failedUrls.has(url);
}
