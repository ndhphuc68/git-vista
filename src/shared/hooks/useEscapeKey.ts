import { useEffect, useRef } from "react";

/**
 * Gọi `onEscape` khi người dùng bấm Escape, chỉ khi `enabled` là true.
 *
 * Callback được giữ trong ref nên đổi callback không làm gắn lại listener —
 * người gọi không cần bọc `useCallback`.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const callbackRef = useRef(onEscape);

  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
