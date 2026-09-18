import { useEffect, useRef } from "react";

/**
 * Registry toàn cục các instance đang bật, theo thứ tự đăng ký.
 * Instance đăng ký SAU CÙNG (trên cùng của chồng modal) được coi là
 * "topmost" — chỉ nó mới được gọi khi Escape được bấm, các instance
 * còn lại (modal cha bên dưới) bị bỏ qua để một lần bấm Escape không
 * đóng cả chồng modal.
 */
const registry: Array<() => void> = [];

let windowListenerAttached = false;

function handleWindowKeyDown(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  e.preventDefault();

  const topmost = registry[registry.length - 1];
  topmost?.();
}

function ensureWindowListener(): void {
  if (windowListenerAttached) return;
  window.addEventListener("keydown", handleWindowKeyDown);
  windowListenerAttached = true;
}

function teardownWindowListenerIfIdle(): void {
  if (registry.length > 0) return;
  window.removeEventListener("keydown", handleWindowKeyDown);
  windowListenerAttached = false;
}

/**
 * Gọi `onEscape` khi người dùng bấm Escape, chỉ khi `enabled` là true.
 *
 * Callback được giữ trong ref nên đổi callback không làm gắn lại listener —
 * người gọi không cần bọc `useCallback`.
 *
 * Khi có nhiều modal lồng nhau cùng bật, chỉ modal đăng ký SAU CÙNG
 * (modal trên cùng) nhận Escape — tránh một lần bấm đóng luôn modal cha.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const callbackRef = useRef(onEscape);
  // Wrapper ổn định theo instance, dùng để định danh trong registry mà
  // không phụ thuộc identity của onEscape (có thể đổi mỗi lần render).
  const dispatchRef = useRef(() => callbackRef.current());

  useEffect(() => {
    callbackRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const dispatch = dispatchRef.current;
    registry.push(dispatch);
    ensureWindowListener();

    return () => {
      const index = registry.indexOf(dispatch);
      if (index !== -1) registry.splice(index, 1);
      teardownWindowListenerIfIdle();
    };
  }, [enabled]);
}
