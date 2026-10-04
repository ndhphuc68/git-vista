import React from "react";
import { useTranslation } from "../../../i18n";
import { SettingsPage } from "../ui";
import { AppearanceThemeSection } from "./AppearanceThemeSection";
import { AppearanceDisplaySection } from "./AppearanceDisplaySection";

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsPage title={t.settings.appearance.title} description={t.settings.appearance.subtitle}>
      <AppearanceThemeSection />
      <AppearanceDisplaySection />
    </SettingsPage>
  );
};
