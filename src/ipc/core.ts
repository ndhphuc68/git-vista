/**
 * Helpers shared by every IPC domain module.
 *
 * Kept separate so the domain modules depend only on this, the generated
 * bindings and the mocks — never on each other.
 */

// Checks whether we are running inside the Tauri runtime
export const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
};

/**
 * Unwraps a generated command result into the shape the app expects.
 *
 * The generated bindings return `{ status: "ok" | "error" }` so callers can
 * branch on failure, but every call site here predates that and expects a
 * promise that resolves to the value or rejects. The error is rethrown exactly
 * as it arrived — a serialized `AppError` is `{ type, message }`, and
 * `toErrorMessage` reads that `message`. Wrapping it in an `Error` would lose
 * the variant and change what the UI displays.
 */
export function unwrap<T, E>(result: { status: "ok"; data: T } | { status: "error"; error: E }): T {
  if (result.status === "error") {
    throw result.error;
  }
  return result.data;
}
