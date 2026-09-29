import React from "react";
import { AlertCircle, Upload, Loader2 } from "lucide-react";
import { type Translations } from "../../i18n/vi";

interface UnpushedWarningBannerProps {
  isPushing: boolean;
  submitting: boolean;
  onPushBranch: () => void;
  t: Translations;
}

/** Banner shown when the compare branch has unpushed commits. */
export const UnpushedWarningBanner: React.FC<UnpushedWarningBannerProps> = ({
  isPushing,
  submitting,
  onPushBranch,
  t,
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
    <div className="flex items-center gap-2">
      <AlertCircle size={14} className="shrink-0" />
      <span>{t.pullRequests.unpushedWarning}</span>
    </div>
    <button
      type="button"
      onClick={onPushBranch}
      disabled={isPushing || submitting}
      className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded border border-amber-500/30 font-medium text-[11px] cursor-pointer transition-colors shrink-0"
    >
      {isPushing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
      <span>{t.pullRequests.pushFirst}</span>
    </button>
  </div>
);
