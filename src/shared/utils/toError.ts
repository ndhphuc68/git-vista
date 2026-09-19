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
