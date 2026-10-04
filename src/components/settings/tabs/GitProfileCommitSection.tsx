import React from "react";
import { useTranslation } from "../../../i18n";
import { SegmentedControl } from "../../../shared/ui";
import { SettingsRow, SettingsSection } from "../ui";

export interface GitProfileCommitSectionProps {
  commitMessageLimit: number;
  onCommitMessageLimitChange: (limit: number) => void;
}

const LABEL_ID = "commit-limit-label";

/** Commit subject length warning (app-wide, saved immediately). */
export const GitProfileCommitSection: React.FC<GitProfileCommitSectionProps> = ({
  commitMessageLimit,
  onCommitMessageLimitChange,
}) => {
  const { t } = useTranslation();
  const p = t.settings.profile;

  return (
    <SettingsSection title={t.settings.sections.commit} hint={t.settings.scope.appWide}>
      <SettingsRow label={p.commitLengthLabel} labelId={LABEL_ID}>
        <SegmentedControl
          aria-labelledby={LABEL_ID}
          value={commitMessageLimit}
          onChange={onCommitMessageLimitChange}
          options={[
            { value: 0, label: p.commitLengthNoLimit, testId: "commit-limit-0" },
            { value: 50, label: p.commitLength50Short, testId: "commit-limit-50" },
            { value: 72, label: p.commitLength72Short, testId: "commit-limit-72" },
          ]}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
