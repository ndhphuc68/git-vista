import { useCallback, useEffect, useRef, useState } from "react";
import { COPY_FEEDBACK_MS } from "../../domain/constants/ui";

/**
 * Copies text to the clipboard and sets the `copied` flag for
 * COPY_FEEDBACK_MS so the UI can show "copied" feedback.
 *
 * The timer is cleared on unmount to avoid setState on an unmounted
 * component.
 */
export function useCopyToClipboard(): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  return { copied, copy };
}
