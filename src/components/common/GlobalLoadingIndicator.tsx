import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../i18n";
import { useGlobalLoadingStore } from "../../store/useGlobalLoadingStore";

/**
 * How long an operation must run before the indicator appears. Most local Git
 * commands finish well under this, and flashing the indicator for them would
 * be noise rather than feedback.
 */
export const GLOBAL_LOADING_DELAY_MS = 250;

/**
 * App-wide "something is running" indicator: a thin indeterminate bar along
 * the top edge plus a small status pill. It never blocks input; it only tells
 * the user the app is still working.
 */
export const GlobalLoadingIndicator: React.FC = () => {
  const { t } = useTranslation();
  const isBusy = useGlobalLoadingStore((s) => s.pendingCount > 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), GLOBAL_LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isBusy]);

  if (!visible) return null;

  return (
    <>
      <div
        role="progressbar"
        aria-label={t.common.processing}
        className="fixed inset-x-0 top-0 z-[10000] h-0.5 overflow-hidden bg-accent-subtle pointer-events-none"
      >
        <div className="global-loading-bar h-full w-1/3 bg-accent" />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-[10000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-subtle shadow-lg text-xs text-secondary pointer-events-none animate-fade-in"
      >
        <Loader2 size={13} className="animate-spin text-accent" aria-hidden="true" />
        <span>{t.common.processing}</span>
      </div>
    </>
  );
};
