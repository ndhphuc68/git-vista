import React from "react";
import { useTranslation } from "../../../i18n";
import { Select } from "../../../shared/ui";
import { useSettingsStore, type DefaultTerminal } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { SettingsRow, SettingsSection } from "../ui";

/** Default terminal picker. */
export const ExternalToolsTerminalSection: React.FC = () => {
  const { t } = useTranslation();
  const tools = t.settings.tools;
  const { defaultTerminal, setDefaultTerminal } = useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.terminal}>
      <SettingsRow
        label={tools.terminalTitle}
        description={tools.terminalDesc}
        help={
          <HelpTooltip
            title={t.settings.help.toolsTerminalTitle}
            description={t.settings.help.toolsTerminalDesc}
            tag={t.settings.help.tagIntegration}
          />
        }
      >
        <Select
          data-testid="terminal-select"
          aria-label={tools.terminalTitle}
          value={defaultTerminal}
          onChange={(value) => setDefaultTerminal(value as DefaultTerminal)}
          options={[
            { value: "wt", label: tools.terminalWindowsTerminal },
            { value: "powershell", label: tools.terminalPowerShell },
            { value: "cmd", label: tools.terminalCmd },
            { value: "bash", label: tools.terminalGitBash },
          ]}
          className="w-72"
        />
      </SettingsRow>
    </SettingsSection>
  );
};
