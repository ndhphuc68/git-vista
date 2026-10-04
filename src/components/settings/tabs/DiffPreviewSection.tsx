import React from "react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { SettingsSection } from "../ui";

export const DiffPreviewSection: React.FC = () => {
  const { t } = useTranslation();
  const { diffFontSize, diffTabSize, diffShowLineNumbers } = useSettingsStore();

  return (
    <SettingsSection title={t.settings.sections.preview}>
      <div
        className="rounded-xl p-4 font-mono overflow-x-auto leading-relaxed select-none"
        style={{ fontSize: `${diffFontSize}px`, tabSize: diffTabSize }}
      >
        {diffShowLineNumbers ? (
          <div className="space-y-1">
            <div className="text-red-400/90 flex gap-3">
              <span className="text-secondary/50 select-none w-6 text-right">41</span>
              <span>- const greeting = "hello";</span>
            </div>
            <div className="text-emerald-400/90 flex gap-3">
              <span className="text-secondary/50 select-none w-6 text-right">41</span>
              <span>+ const greeting = "Hello, GitVista!";</span>
            </div>
            <div className="text-secondary flex gap-3">
              <span className="text-secondary/50 select-none w-6 text-right">42</span>
              <span> console.log(greeting);</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-red-400/90">- const greeting = "hello";</div>
            <div className="text-emerald-400/90">+ const greeting = "Hello, GitVista!";</div>
            <div className="text-secondary"> console.log(greeting);</div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};
