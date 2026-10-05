/**
 * opener IPC commands.
 *
 * The webview ignores `target="_blank"` and `window.open`, so external links
 * go through the opener plugin, which hands them to the system browser.
 */
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "./core";

export const openerCommands = {
  openExternalUrl: async (url: string): Promise<void> => {
    // The browser dev build can open a new tab itself.
    if (!isTauri()) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    await openUrl(url);
  },
};
