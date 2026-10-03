import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useGlobalLoadingStore } from "../../store/useGlobalLoadingStore";
import { Z_INDEX } from "../../domain/constants/zIndex";

/**
 * How long an operation must run before the indicator appears. Most local Git
 * commands finish well under this, and flashing the indicator for them would
 * be noise rather than feedback.
 */
export const GLOBAL_LOADING_DELAY_MS = 200;

const blockEvent = (e: React.SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * App-wide full-screen blocking loading overlay.
 *
 * Covers the entire viewport with a backdrop, disables mouse interaction, and
 * captures keyboard shortcuts while an operation is in progress so the user
 * cannot trigger conflicting actions while waiting.
 */
export const GlobalLoadingIndicator: React.FC = () => {
  const { t } = useTranslation();
  const isBusy = useGlobalLoadingStore((s) => s.pendingCount > 0);
  const customMessage = useGlobalLoadingStore((s) => s.message);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), GLOBAL_LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isBusy]);

  useEffect(() => {
    if (!visible) return;

    const blockKeyboard = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", blockKeyboard, true);
    return () => {
      window.removeEventListener("keydown", blockKeyboard, true);
    };
  }, [visible]);

  if (!visible) return null;

  const displayMessage = customMessage || t.common.processing;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={displayMessage}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none cursor-wait pointer-events-auto animate-fade-in"
      style={{ zIndex: Z_INDEX.globalLoading }}
      onClick={blockEvent}
      onMouseDown={blockEvent}
      onMouseUp={blockEvent}
      onContextMenu={blockEvent}
    >
      <div
        className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-surface/95 border border-border-subtle shadow-2xl text-center max-w-sm mx-4 animate-scale-in"
        onClick={blockEvent}
      >
        <Loader2 size={28} className="animate-spin text-accent" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-primary">{displayMessage}</span>
          <span className="text-xs text-secondary">{t.common.pleaseWait}</span>
        </div>
      </div>
    </div>
  );
};
