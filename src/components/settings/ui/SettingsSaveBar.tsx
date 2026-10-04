import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";

export interface SettingsSaveBarProps {
  visible: boolean;
  saving: boolean;
  saveDisabled: boolean;
  saveLabel: string;
  onDiscard: () => void;
}

/** Floating bar pinned to the bottom of the content column while a form has unsaved changes. */
export const SettingsSaveBar: React.FC<SettingsSaveBarProps> = ({
  visible,
  saving,
  saveDisabled,
  saveLabel,
  onDiscard,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-header px-4 py-3 shadow-lg">
      <span className="text-xs font-medium text-secondary">{t.settings.saveBar.unsaved}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          data-testid="discard-profile-btn"
          onClick={onDiscard}
          disabled={saving}
        >
          {t.settings.saveBar.discard}
        </Button>
        <Button
          variant="primary"
          type="submit"
          data-testid="save-profile-btn"
          loading={saving}
          disabled={saveDisabled}
        >
          <Check size={14} />
          <span>{saveLabel}</span>
        </Button>
      </div>
    </div>
  );
};
