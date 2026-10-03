import React from "react";
import { useTranslation } from "../../../i18n";
import { Checkbox, Input } from "../../../shared/ui";

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
        <Checkbox
          checked={useSeparatePush}
          onChange={(e) => onUseSeparatePushChange(e.target.checked)}
          disabled={loading}
        />
        <span>{t.modals.remotes.addModal.separatePushUrl}</span>
      </label>

      {useSeparatePush && (
        <div className="flex flex-col gap-1.5 pl-6 animate-fade-in">
          <label htmlFor="remote-push-url-input" className="text-xs font-medium text-secondary">
            {t.modals.remotes.addModal.pushUrlLabel}
          </label>
          <Input
            size="md"
            mono
            id="remote-push-url-input"
            value={pushUrl}
            onChange={(e) => onPushUrlChange(e.target.value)}
            placeholder={t.modals.remotes.addModal.pushUrlPlaceholder}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
};
