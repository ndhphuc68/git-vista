import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export interface DiscardConfirmModalProps {
  isOpen: boolean;
  filePath: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardConfirmModal: React.FC<DiscardConfirmModalProps> = ({
  isOpen,
  filePath,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !filePath) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "var(--space-4)",
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-modal-title"
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "var(--shadow-modal, 0 20px 25px -5px rgba(0, 0, 0, 0.3))",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-3) var(--space-4)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="var(--diff-remove-text)" />
            <h3
              id="discard-modal-title"
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Huỷ thay đổi / Discard Changes
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-primary)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Các thay đổi trong file này sẽ bị huỷ vĩnh viễn và không thể khôi phục.
          </p>

          <div
            style={{
              padding: "var(--space-2) var(--space-3)",
              backgroundColor: "var(--bg-window)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              color: "var(--text-primary)",
              wordBreak: "break-all",
            }}
          >
            {filePath}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-4)",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <button
            type="button"
            data-testid="cancel-discard-button"
            onClick={onCancel}
            style={{
              padding: "6px 12px",
              backgroundColor: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            Huỷ bỏ
          </button>

          <button
            type="button"
            data-testid="confirm-discard-button"
            onClick={onConfirm}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--diff-remove-text)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Huỷ thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
