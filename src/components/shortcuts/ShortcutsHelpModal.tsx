import React, { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

export interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  label: string;
  keys: string[];
}

interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "Chung",
    items: [
      { label: "Command Palette", keys: ["Ctrl+K"] },
      { label: "Trợ giúp phím tắt", keys: ["?", "Ctrl+/"] },
      { label: "Đóng modal / Thoát", keys: ["Esc"] },
    ],
  },
  {
    title: "Điều hướng màn hình",
    items: [
      { label: "Màn hình Lịch sử", keys: ["Ctrl+1"] },
      { label: "Màn hình Thay đổi", keys: ["Ctrl+2"] },
    ],
  },
  {
    title: "Thao tác Git",
    items: [
      { label: "Tạo nhánh mới", keys: ["Ctrl+B"] },
      { label: "Lưu thay đổi (Commit)", keys: ["Ctrl+Enter"] },
      { label: "Lấy về (Fetch)", keys: ["Ctrl+Shift+F"] },
      { label: "Kéo về (Pull)", keys: ["Ctrl+Shift+P"] },
      { label: "Đẩy lên (Push)", keys: ["Ctrl+Shift+U"] },
      { label: "Stage tất cả thay đổi", keys: ["Ctrl+Shift+A"] },
    ],
  },
  {
    title: "Cài đặt & Giao diện",
    items: [
      { label: "Đổi giao diện Sáng/Tối", keys: ["Ctrl+T"] },
    ],
  },
];

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
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
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface-header/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Keyboard size={18} />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="text-sm font-semibold text-primary m-0"
              >
                Bảng phím tắt
              </h2>
              <p className="text-[11px] text-secondary m-0">
                Phím tắt thao tác nhanh trong ứng dụng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover rounded-md transition-colors"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {SHORTCUT_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="bg-window/50 rounded-lg p-3.5 border border-border-subtle/50 flex flex-col gap-2.5"
            >
              <h3 className="text-xs font-semibold text-accent uppercase tracking-wider m-0">
                {section.title}
              </h3>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-primary truncate">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, idx) => (
                        <React.Fragment key={k}>
                          {idx > 0 && (
                            <span className="text-secondary text-[10px]">/</span>
                          )}
                          <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-primary bg-surface border border-border-subtle rounded shadow-xs">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-header/20 flex items-center justify-between text-xs text-secondary">
          <span>Mẹo: Nhấn phím <kbd className="px-1 py-0.2 text-[10px] font-mono bg-window border border-border-subtle rounded">?</kbd> bất cứ lúc nào để xem bảng này</span>
          <span className="text-[11px] text-secondary/70">Esc để đóng</span>
        </div>
      </div>
    </div>
  );
};
