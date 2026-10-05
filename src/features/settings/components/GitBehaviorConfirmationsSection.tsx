import React from "react";
import { useTranslation } from "../../../i18n";
import { Switch } from "../../../shared/ui";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../../../components/settings/HelpTooltip";
import { ConfirmationsDiagram } from "../../../components/settings/helpDiagrams";
import { SettingsRow, SettingsSection } from "./ui";

/** Safety confirmation switches: discard and delete branch warnings. */
export const GitBehaviorConfirmationsSection: React.FC = () => {
  const { t } = useTranslation();
  const b = t.settings.behavior;
  const s = useSettingsStore();
  const rows = [
    {
      id: "confirm-discard",
      label: b.confirmDiscardLabel,
      checked: s.confirmDiscard,
      set: s.setConfirmDiscard,
    },
    {
      id: "confirm-delete-branch",
      label: b.confirmDeleteBranchLabel,
      checked: s.confirmDeleteBranch,
      set: s.setConfirmDeleteBranch,
    },
  ];

  return (
    <SettingsSection
      title={b.confirmationsTitle}
      help={
        <HelpTooltip
          title={t.settings.help.confirmationsTitle}
          description={t.settings.help.confirmationsDesc}
          tag={t.settings.help.tagSafety}
          diagram={<ConfirmationsDiagram />}
        />
      }
    >
      {rows.map((row) => (
        <SettingsRow key={row.id} label={row.label} labelId={`${row.id}-label`}>
          <Switch
            checked={row.checked}
            onChange={row.set}
            aria-labelledby={`${row.id}-label`}
            data-testid={`toggle-${row.id}`}
          />
        </SettingsRow>
      ))}
    </SettingsSection>
  );
};
