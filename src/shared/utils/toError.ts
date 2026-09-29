/**
 * Converts an arbitrary error value into a displayable string.
 *
 * Tauri can throw an Error, a string, or an object with a message field
 * depending on how the error originated, so all three shapes must be
 * handled.
 */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string") return message;
  }
  return String(err);
}

/**
 * Returns `err.message` when the thrown value carries a string message
 * (an `Error`, or the `{ type, message }` shape of a Tauri `AppError`), and
 * `undefined` otherwise.
 *
 * Unlike `toErrorMessage`, a thrown string yields `undefined`. That matches
 * what `err?.message` evaluated to in the `catch (err: any)` blocks this
 * replaces, so their `|| fallback` still kicks in exactly as before.
 */
export function messageOf(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string") return message;
  }
  return undefined;
}
