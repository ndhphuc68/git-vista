import React from "react";
import { useTranslation } from "../../../i18n";
import { AppearanceLocaleSection } from "./AppearanceLocaleSection";
import { AppearanceDateFormatSection } from "./AppearanceDateFormatSection";
import { AppearanceAvatarSection } from "./AppearanceAvatarSection";
import { AppearanceColorblindSection } from "./AppearanceColorblindSection";

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">{t.settings.appearance.title}</h3>
        <p className="text-xs text-secondary">{t.settings.appearance.subtitle}</p>
      </div>

      <AppearanceLocaleSection />
      <AppearanceDateFormatSection />
      <AppearanceAvatarSection />
      <AppearanceColorblindSection />
    </div>
  );
};
