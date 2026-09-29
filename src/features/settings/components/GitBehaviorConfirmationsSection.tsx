import React from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { ConfirmationsDiagram } from "../../../components/settings/helpDiagrams";
import { GitBehaviorToggleSwitch } from "./GitBehaviorToggleSwitch";

/** Safety confirmation toggles: discard, delete branch, and force-push warnings. */
export const GitBehaviorConfirmationsSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    confirmDiscard,
    confirmDeleteBranch,
    confirmForcePush,
    setConfirmDiscard,
    setConfirmDeleteBranch,
    setConfirmForcePush,
  } = useSettingsStore();

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-accent" />
        <span className="text-xs font-semibold text-primary block">
          {t.settings.behavior.confirmationsTitle}
        </span>
        <HelpTooltip
          title={t.settings.help.confirmationsTitle}
          description={t.settings.help.confirmationsDesc}
          tag={t.settings.help.tagSafety}
          diagram={<ConfirmationsDiagram />}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <span className="text-xs font-medium text-primary">
            {t.settings.behavior.confirmDiscardLabel}
          </span>
          <GitBehaviorToggleSwitch
            checked={confirmDiscard}
            testId="toggle-confirm-discard"
            ariaLabel={t.settings.behavior.confirmDiscardLabel}
            onClick={() => setConfirmDiscard(!confirmDiscard)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <span className="text-xs font-medium text-primary">
            {t.settings.behavior.confirmDeleteBranchLabel}
          </span>
          <GitBehaviorToggleSwitch
            checked={confirmDeleteBranch}
            testId="toggle-confirm-delete-branch"
            ariaLabel={t.settings.behavior.confirmDeleteBranchLabel}
            onClick={() => setConfirmDeleteBranch(!confirmDeleteBranch)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <span className="text-xs font-medium text-primary">
            {t.settings.behavior.confirmForcePushLabel}
          </span>
          <GitBehaviorToggleSwitch
            checked={confirmForcePush}
            testId="toggle-confirm-force-push"
            ariaLabel={t.settings.behavior.confirmForcePushLabel}
            onClick={() => setConfirmForcePush(!confirmForcePush)}
          />
        </div>
      </div>
    </div>
  );
};
