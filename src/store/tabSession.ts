import { type TabSessionData } from "../types/tab";

/** A tab session read back from storage, narrowed from untrusted JSON. */
export interface ParsedTabSession {
  openRepoPaths: string[];
  activeTabId?: TabSessionData["activeTabId"];
}

/**
 * Parses the persisted tab session. Returns null when the value is not an
 * object with an `openRepoPaths` array, so the restore is skipped instead of
 * failing halfway through. Invalid JSON still throws, which the caller logs.
 */
export function parseTabSession(raw: string): ParsedTabSession | null {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const { openRepoPaths, activeTabId } = value as Record<string, unknown>;
  if (!Array.isArray(openRepoPaths)) return null;

  return {
    openRepoPaths: openRepoPaths.filter((path): path is string => typeof path === "string"),
    activeTabId: typeof activeTabId === "string" ? activeTabId : undefined,
  };
}
