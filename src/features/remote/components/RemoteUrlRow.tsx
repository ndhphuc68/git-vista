import React from "react";
import { Copy, Check } from "lucide-react";
import { useTranslation } from "../../../i18n";

export interface RemoteUrlRowProps {
  label: string;
  url: string | null | undefined;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

/**
 * A single fetch/push URL row with its copy button, shown inside
 * `RemoteListItem`. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const RemoteUrlRow: React.FC<RemoteUrlRowProps> = ({
  label,
  url,
  copyKey,
  copiedKey,
  onCopy,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-surface/50 border border-border-subtle/40">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-tertiary shrink-0">
          {label}:
        </span>
        <span className="text-secondary truncate select-all">{url || "—"}</span>
      </div>
      {url && (
        <button
          type="button"
          onClick={() => onCopy(url, copyKey)}
          title={t.modals.remotes.copyUrlTooltip}
          className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer shrink-0"
        >
          {copiedKey === copyKey ? (
            <Check size={12} className="text-emerald-500" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      )}
    </div>
  );
};
