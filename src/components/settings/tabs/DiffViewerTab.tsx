import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../ui";
import { DiffLayoutSection } from "./DiffLayoutSection";
import { DiffOptionsSection } from "./DiffOptionsSection";
import { DiffPreviewSection } from "./DiffPreviewSection";

export const DiffViewerTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.diff.title} description={t.settings.diff.subtitle}>
      <DiffLayoutSection />
      <DiffOptionsSection />
      <DiffPreviewSection />
    </SettingsPage>
  );
};
