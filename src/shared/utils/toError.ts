/**
 * Chuyển giá trị lỗi bất kỳ thành chuỗi hiển thị được.
 *
 * Tauri có thể ném ra Error, chuỗi, hoặc object có trường message tuỳ
 * cách lỗi phát sinh, nên phải xử lý cả ba dạng.
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
