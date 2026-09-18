import React from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Transition } from "../../components/common/Transition";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { MODAL_SIZE, type ModalSize } from "../../domain/constants/ui";
import { MOTION } from "../../domain/constants/motion";
import { Z_INDEX } from "../../domain/constants/zIndex";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  /** id của phần tử tiêu đề, gắn vào aria-labelledby. */
  labelledBy?: string;
  /** Chặn đóng modal khi đang có thao tác dở dang. */
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  titleId?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "danger";
}

interface ModalComposition {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
}

/**
 * Khung modal dùng chung cho toàn ứng dụng.
 *
 * Tự lo backdrop, phím Escape, role/aria, chặn sự kiện click lan ra ngoài
 * và z-index — modal con chỉ việc mô tả nội dung.
 *
 * Dùng compound component (Modal.Header/Body/Footer) thay vì boolean props,
 * vì thân của các modal rất khác nhau; nếu dùng props thì sẽ phải thêm cờ
 * mới cho mỗi biến thể.
 */
const ModalRoot: React.FC<ModalProps> & ModalComposition = ({
  isOpen,
  onClose,
  children,
  size = "md",
  labelledBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  useEscapeKey(isOpen && closeOnEscape, onClose);

  return (
    <Transition
      show={isOpen}
      duration={MOTION.fast}
      className="fixed inset-0"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-150 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: Z_INDEX.modal }}
        onClick={closeOnBackdrop ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <div
          data-testid="modal-panel"
          className={clsx(
            "w-full max-h-[90vh] bg-surface border border-border-subtle rounded-xl",
            "shadow-2xl overflow-hidden flex flex-col animate-scale-in",
            MODAL_SIZE[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Transition>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  titleId,
  icon: Icon,
  tone = "default",
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
    <div className="flex items-center gap-2">
      {Icon && (
        <Icon
          size={16}
          className={tone === "danger" ? "text-diff-remove-text" : "text-accent"}
        />
      )}
      <h3 id={titleId} className="text-xs font-semibold text-primary m-0">
        {title}
      </h3>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-md transition-colors"
    >
      <X size={16} />
    </button>
  </div>
);

const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={clsx("p-4 flex flex-col gap-3 overflow-y-auto min-h-0", className)}>
    {children}
  </div>
);

const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={clsx(
      "flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface shrink-0",
      className
    )}
  >
    {children}
  </div>
);

ModalRoot.Header = ModalHeader;
ModalRoot.Body = ModalBody;
ModalRoot.Footer = ModalFooter;

export const Modal = ModalRoot;
