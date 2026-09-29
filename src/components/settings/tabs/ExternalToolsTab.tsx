import React from "react";
import { useTranslation } from "../../../i18n";
import { ExternalToolsEditorSection } from "./ExternalToolsEditorSection";
import { ExternalToolsTerminalSection } from "./ExternalToolsTerminalSection";

export const ExternalToolsTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">{t.settings.tools.title}</h3>
        <p className="text-xs text-secondary">{t.settings.tools.subtitle}</p>
      </div>

      <ExternalToolsEditorSection />
      <ExternalToolsTerminalSection />
    </div>
  );
};
