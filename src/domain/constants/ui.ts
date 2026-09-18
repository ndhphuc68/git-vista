/** Số ký tự hiển thị khi rút gọn commit SHA. */
export const SHORT_SHA_LENGTH = 7;

/** Thời gian giữ trạng thái "đã sao chép" trước khi tự tắt. */
export const COPY_FEEDBACK_MS = 2000;

/** Độ trễ trước khi focus input trong modal, chờ animation mở xong. */
export const AUTOFOCUS_DELAY_MS = 50;

/** Thời gian toast hoàn tác hiển thị, đủ dài để người dùng kịp bấm Undo. */
export const UNDO_TOAST_MS = 10000;

export type ModalSize = "sm" | "md" | "lg" | "xl";

/** Chiều rộng tối đa của modal theo từng bậc. */
export const MODAL_SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};
