import React from "react";
import { Hash } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";
import { WhitespaceDiagram } from "../helpDiagrams";

export const DiffTogglesSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    diffIgnoreWhitespace,
    diffShowLineNumbers,
    setDiffIgnoreWhitespace,
    setDiffShowLineNumbers,
  } = useSettingsStore();

  return (
    <div className="pt-2 border-t border-border-subtle space-y-3">
      {/* Ignore Whitespace */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-primary block">
              {t.settings.diff.whitespaceTitle}
            </span>
            <HelpTooltip
              title={t.settings.help.diffWhitespaceTitle}
              description={t.settings.help.diffWhitespaceDesc}
              tag={t.settings.help.tagRecommended}
              diagram={<WhitespaceDiagram />}
            />
          </div>
          <span className="text-[11px] text-secondary block mt-0.5">
            {t.settings.diff.whitespaceIgnoreDesc}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={diffIgnoreWhitespace}
          data-testid="toggle-diff-ignore-whitespace"
          onClick={() => setDiffIgnoreWhitespace(!diffIgnoreWhitespace)}
          aria-label={t.settings.diff.whitespaceIgnore}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
            diffIgnoreWhitespace ? "bg-accent" : "bg-border-strong"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              diffIgnoreWhitespace ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Show Line Numbers */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
        <div className="flex items-center gap-3">
          <Hash size={16} className="text-secondary" />
          <div>
            <span className="text-xs font-semibold text-primary block">
              {t.settings.diff.lineNumbersTitle}
            </span>
            <span className="text-[11px] text-secondary block mt-0.5">
              {t.settings.diff.lineNumbersDesc}
            </span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={diffShowLineNumbers}
          data-testid="toggle-diff-show-line-numbers"
          onClick={() => setDiffShowLineNumbers(!diffShowLineNumbers)}
          aria-label={t.settings.diff.lineNumbersTitle}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
            diffShowLineNumbers ? "bg-accent" : "bg-border-strong"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              diffShowLineNumbers ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};
