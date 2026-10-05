/**
 * Opens web links in the system browser, so components and app-shell hooks do
 * not import `ipc/` directly.
 */
import { openerCommands } from "../../../ipc/opener";

const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** True when `href` is an absolute link the system browser should handle. */
export function isExternalUrl(href: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

/** Opens `url` in the system browser. Non-web URLs are ignored. */
export function openExternalUrl(url: string): Promise<void> {
  if (!isExternalUrl(url)) return Promise.resolve();
  return openerCommands.openExternalUrl(url);
}
