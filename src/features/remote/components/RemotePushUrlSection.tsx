import React from "react";
import { useTranslation } from "../../../i18n";

const INPUT_CLASS =
  "px-3 py-2 text-xs bg-window border border-border-subtle rounded-lg text-primary " +
  "placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 " +
  "focus:ring-accent/20 transition-all font-mono";

export interface RemotePushUrlSectionProps {
  useSeparatePush: boolean;
  onUseSeparatePushChange: (checked: boolean) => void;
  pushUrl: string;
  onPushUrlChange: (value: string) => void;
  loading: boolean;
}

/**
 * "Custom Push URL" checkbox and its conditional URL field in
 * `AddEditRemoteModal`. Extracted from the component body, keeping the same
 * markup verbatim.
 */
export const RemotePushUrlSection: React.FC<RemotePushUrlSectionProps> = ({
  useSeparatePush,
  onUseSeparatePushChange,
  pushUrl,
  onPushUrlChange,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle/50">
      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-primary">
        <input
          type="checkbox"
          checked={useSeparatePush}
          onChange={(e) => onUseSeparatePushChange(e.target.checked)}
          disabled={loading}
          className="rounded border-border-subtle text-accent focus:ring-accent"
        />
        <span>{t.modals.remotes.addModal.separatePushUrl}</span>
      </label>

      {useSeparatePush && (
        <div className="flex flex-col gap-1.5 pl-6 animate-fade-in">
          <label htmlFor="remote-push-url-input" className="text-xs font-medium text-secondary">
            {t.modals.remotes.addModal.pushUrlLabel}
          </label>
          <input
            id="remote-push-url-input"
            type="text"
            value={pushUrl}
            onChange={(e) => onPushUrlChange(e.target.value)}
            placeholder={t.modals.remotes.addModal.pushUrlPlaceholder}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>
      )}
    </div>
  );
};
