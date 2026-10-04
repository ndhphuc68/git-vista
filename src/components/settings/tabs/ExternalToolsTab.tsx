import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../../../features/settings";
import { ExternalToolsEditorSection } from "./ExternalToolsEditorSection";
import { ExternalToolsTerminalSection } from "./ExternalToolsTerminalSection";

export const ExternalToolsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.tools.title} description={t.settings.tools.subtitle}>
      <ExternalToolsEditorSection />
      <ExternalToolsTerminalSection />
    </SettingsPage>
  );
};
