import React from "react";
import { useTranslation } from "../../../../i18n";
import { Button, Switch } from "../../../../shared/ui";
import { SettingsRow } from "./SettingsRow";

export interface SettingsInheritRowProps {
  inheriting: boolean;
  onInheritChange: (inherit: boolean) => void;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Show the reset button (the repo has a saved local override). */
  canReset?: boolean;
  onReset?: () => void;
}

const LABEL_ID = "settings-use-global-label";

/** "Use global configuration" card shown at the top of a Git config tab in repo scope. */
export const SettingsInheritRow: React.FC<SettingsInheritRowProps> = ({
  inheriting,
  onInheritChange,
  description,
  disabled,
  canReset,
  onReset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-accent/30 bg-accent-subtle/30">
      <SettingsRow label={t.settings.scope.useGlobal} labelId={LABEL_ID} description={description}>
        {canReset && onReset && (
          <Button
            variant="secondary"
            data-testid="reset-to-global-btn"
            onClick={onReset}
            disabled={disabled}
          >
            {t.settings.profile.resetToGlobalBtn}
          </Button>
        )}
        <Switch
          checked={inheriting}
          onChange={onInheritChange}
          disabled={disabled}
          aria-labelledby={LABEL_ID}
          data-testid="toggle-use-global"
        />
      </SettingsRow>
    </div>
  );
};
