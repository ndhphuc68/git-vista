import React from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Transition } from "../../components/common/Transition";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { MODAL_SIZE, type ModalSize } from "../../domain/constants/ui";
import { MOTION } from "../../domain/constants/motion";
import { Z_INDEX } from "../../domain/constants/zIndex";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  /** id of the title element, wired to aria-labelledby. */
  labelledBy?: string;
  /**
   * Accessible name for dialogs whose title lives in a child component with
   * no id to point at, so `labelledBy` is not an option. Use one or the
   * other, not both — `labelledBy` is preferred where a title element exists.
   */
  label?: string;
  /** Prevent closing the modal while an operation is in progress. */
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /**
   * Set to true when this modal is opened FROM WITHIN another modal
   * (modal-in-modal, e.g. ManageRemotesModal opening AddEditRemoteModal).
   * Raises the z-index to the `modalStacked` layer so the child modal's
   * backdrop always sits above the parent modal, regardless of DOM order.
   * Defaults to false.
   */
  stacked?: boolean;
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
 * Shared modal shell for the whole app.
 *
 * Handles the backdrop, the Escape key, focus management (trap, initial
 * focus, restoring focus to the opener), role/aria attributes, stopping
 * click events from bubbling outside, and z-index — individual modals only
 * need to describe their content.
 *
 * Initial focus lands on the first focusable element in the panel. To focus
 * something else instead (usually a text input), mark it `data-autofocus`.
 *
 * Uses a compound component (Modal.Header/Body/Footer) instead of boolean
 * props, because modal bodies vary widely; with boolean props we'd need to
 * keep adding new flags for each variant.
 *
 * Modal-in-modal: use the `stacked` prop on the child modal so it always
 * floats above the parent modal (see ModalProps.stacked).
 */
const ModalRoot: React.FC<ModalProps> & ModalComposition = ({
  isOpen,
  onClose,
  children,
  size = "md",
  labelledBy,
  label,
  closeOnBackdrop = true,
  closeOnEscape = true,
  stacked = false,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEscapeKey(isOpen && closeOnEscape, onClose);
  useFocusTrap(panelRef, isOpen);

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
        style={{ zIndex: stacked ? Z_INDEX.modalStacked : Z_INDEX.modal }}
        onClick={closeOnBackdrop ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
      >
        <div
          ref={panelRef}
          data-testid="modal-panel"
          className={clsx(
            "max-h-[90vh] bg-surface border border-border-subtle rounded-xl",
            "shadow-2xl overflow-hidden flex flex-col animate-scale-in",
            // The `full` tier sizes itself from its content, so it must not be
            // stretched to the available width the way the fixed tiers are.
            size === "full" ? "max-w-none" : "w-full",
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
