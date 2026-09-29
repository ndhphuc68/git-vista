import React from "react";
import { useTranslation } from "../../../i18n";
import { DiffViewModeSection } from "./DiffViewModeSection";
import { DiffFontSizeSection } from "./DiffFontSizeSection";
import { DiffTabSizeSection } from "./DiffTabSizeSection";
import { DiffTogglesSection } from "./DiffTogglesSection";
import { DiffPreviewSection } from "./DiffPreviewSection";

export const DiffViewerTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">{t.settings.diff.title}</h3>
        <p className="text-xs text-secondary">{t.settings.diff.subtitle}</p>
      </div>

      <DiffViewModeSection />
      <DiffFontSizeSection />
      <DiffTabSizeSection />
      <DiffTogglesSection />
      <DiffPreviewSection />
    </div>
  );
};
