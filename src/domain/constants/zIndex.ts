/**
 * Thang bậc z-index toàn ứng dụng. Giá trị cách nhau 10 để còn chỗ chèn
 * tầng mới mà không phải đánh số lại toàn bộ.
 */
export const Z_INDEX = {
  dropdown: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
  /** Modal mở lồng bên trong một modal khác (modal-trong-modal). */
  modalStacked: 50,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
