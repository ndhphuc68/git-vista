import { useEffect } from "react";
import { isExternalUrl, openExternalUrl } from "../features/repo";

/** Returns the anchor an event came from, if it links outside the app. */
function findExternalAnchor(event: MouseEvent): HTMLAnchorElement | null {
  if (!(event.target instanceof Element)) return null;
  const anchor = event.target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  // `anchor.href` is always absolute, so in-app links resolve to the app's own
  // origin (http://tauri.localhost on Windows) and must be left alone.
  if (new URL(anchor.href).origin === window.location.origin) return null;
  return isExternalUrl(anchor.href) ? anchor : null;
}

/**
 * Routes clicks on external links to the system browser. The webview would
 * otherwise drop `target="_blank"` links or navigate the app window away.
 */
export function useExternalLinks() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button > 1) return;
      const anchor = findExternalAnchor(event);
      if (!anchor) return;
      event.preventDefault();
      void openExternalUrl(anchor.href).catch((err: unknown) => {
        console.error("Failed to open external link", err);
      });
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("auxclick", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("auxclick", handleClick);
    };
  }, []);
}
