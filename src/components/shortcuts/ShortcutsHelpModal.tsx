import React, { useEffect, useMemo } from "react";
import { X, Keyboard } from "lucide-react";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

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

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const sections: ShortcutSection[] = useMemo(
    () => [
      {
        title: t.shortcuts.categories.general,
        items: [
          { label: t.shortcuts.items.commandPalette, keys: ["Ctrl+K"] },
          { label: t.shortcuts.items.shortcutsHelp, keys: ["?", "Ctrl+/"] },
          { label: t.shortcuts.items.closeModal, keys: ["Esc"] },
        ],
      },
      {
        title: t.shortcuts.categories.navigation,
        items: [
          { label: t.shortcuts.items.historyScreen, keys: ["Ctrl+1"] },
          { label: t.shortcuts.items.changesScreen, keys: ["Ctrl+2"] },
        ],
      },
      {
        title: t.shortcuts.categories.git,
        items: [
          { label: t.shortcuts.items.createBranch, keys: ["Ctrl+B"] },
          { label: t.shortcuts.items.commitChanges, keys: ["Ctrl+Enter"] },
          { label: t.shortcuts.items.fetchRemote, keys: ["Ctrl+Shift+F"] },
          { label: t.shortcuts.items.pullRemote, keys: ["Ctrl+Shift+P"] },
          { label: t.shortcuts.items.pushRemote, keys: ["Ctrl+Shift+U"] },
          { label: t.shortcuts.items.stageAll, keys: ["Ctrl+Shift+A"] },
        ],
      },
      {
        title: t.shortcuts.categories.settings,
        items: [
          { label: t.shortcuts.items.toggleTheme, keys: ["Ctrl+T"] },
          { label: t.settings.title, keys: ["Ctrl+,"] },
        ],
      },
    ],
    [t]
  );

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

  return (
    <Transition
      show={isOpen}
      className="fixed inset-0 z-[9999]"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        <div
          className="bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface-header/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Keyboard size={18} />
              </div>
              <div>
                <h2 id="shortcuts-modal-title" className="text-sm font-semibold text-primary m-0">
                  {t.shortcuts.title}
                </h2>
                <p className="text-[11px] text-secondary m-0">{t.shortcuts.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover rounded-md transition-colors"
              aria-label={t.common.close}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {sections.map((section) => (
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
                            {idx > 0 && <span className="text-secondary text-[10px]">/</span>}
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
            <span>
              {t.shortcuts.tip.includes("{key}") ? (
                <>
                  {t.shortcuts.tip.split("{key}")[0]}
                  <kbd className="px-1 py-0.2 text-[10px] font-mono bg-window border border-border-subtle rounded">
                    ?
                  </kbd>
                  {t.shortcuts.tip.split("{key}")[1]}
                </>
              ) : (
                t.shortcuts.tip
              )}
            </span>
            <span className="text-[11px] text-secondary/70">{t.shortcuts.escToClose}</span>
          </div>
        </div>
      </div>
    </Transition>
  );
};
