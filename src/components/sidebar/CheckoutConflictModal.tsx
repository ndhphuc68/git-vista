import React, { useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

export interface CheckoutConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBranch: string;
  errorMessage: string;
  onNavigateToChanges: () => void;
}

export const CheckoutConflictModal: React.FC<CheckoutConflictModalProps> = ({
  isOpen,
  onClose,
  targetBranch,
  errorMessage,
  onNavigateToChanges,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-conflict-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-120 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-diff-remove-text" />
            <h3
              id="checkout-conflict-title"
              className="text-xs font-semibold text-primary m-0"
            >
              Xung đột khi chuyển nhánh
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-sm transition-colors"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-primary leading-normal m-0">
            Không thể chuyển sang nhánh <strong className="font-semibold">{targetBranch}</strong> vì bạn đang có các file sửa đổi dở dang bị trùng lặp và có thể bị ghi đè.
          </p>

          <div className="p-3 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs font-mono break-all leading-relaxed max-h-40 overflow-y-auto">
            {errorMessage.replace("CHECKOUT_CONFLICT: ", "")}
          </div>

          <p className="text-[11px] text-secondary leading-normal m-0">
            Để tiếp tục chuyển nhánh một cách an toàn, bạn nên chuyển sang màn hình <strong>Thay đổi (Changes)</strong> để thực hiện commit hoặc hoàn tác các file trên trước.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToChanges();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span>Đến màn hình Thay đổi</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
