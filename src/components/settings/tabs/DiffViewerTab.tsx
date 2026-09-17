import React from "react";
import { Columns, AlignLeft, Type, Hash, Space } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, DiffViewMode, DiffFontSize, DiffTabSize } from "../../../store/useSettingsStore";

export const DiffViewerTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    diffViewMode,
    diffFontSize,
    diffIgnoreWhitespace,
    diffTabSize,
    diffShowLineNumbers,
    setDiffViewMode,
    setDiffFontSize,
    setDiffIgnoreWhitespace,
    setDiffTabSize,
    setDiffShowLineNumbers,
  } = useSettingsStore();

  const viewModeOptions: { value: DiffViewMode; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "unified",
      title: t.settings.diff.viewModeUnified,
      desc: t.settings.diff.viewModeUnifiedDesc,
      icon: <AlignLeft size={18} />,
    },
    {
      value: "split",
      title: t.settings.diff.viewModeSplit,
      desc: t.settings.diff.viewModeSplitDesc,
      icon: <Columns size={18} />,
    },
  ];

  const fontSizeOptions: { value: DiffFontSize; label: string }[] = [
    { value: 12, label: t.settings.diff.fontSize12 },
    { value: 13, label: t.settings.diff.fontSize13 },
    { value: 14, label: t.settings.diff.fontSize14 },
    { value: 16, label: t.settings.diff.fontSize16 },
  ];

  const tabSizeOptions: { value: DiffTabSize; label: string }[] = [
    { value: 2, label: t.settings.diff.tabSize2 },
    { value: 4, label: t.settings.diff.tabSize4 },
    { value: 8, label: t.settings.diff.tabSize8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">
          {t.settings.diff.title}
        </h3>
        <p className="text-xs text-secondary">
          {t.settings.diff.subtitle}
        </p>
      </div>

      {/* View Mode */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-secondary block">
          {t.settings.diff.viewModeTitle}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {viewModeOptions.map((opt) => {
            const isSelected = diffViewMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`diff-mode-${opt.value}`}
                onClick={() => setDiffViewMode(opt.value)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                    : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                }`}
              >
                <div className={`p-1.5 rounded-md ${isSelected ? "text-accent bg-accent/15" : "text-secondary bg-surface"}`}>
                  {opt.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-primary">{opt.title}</div>
                  <div className="text-[11px] text-secondary mt-0.5 leading-relaxed">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Type size={14} className="text-secondary" />
          <label className="text-xs font-medium text-secondary block">
            {t.settings.diff.fontSizeTitle}
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fontSizeOptions.map((opt) => {
            const isSelected = diffFontSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`diff-fontsize-${opt.value}`}
                onClick={() => setDiffFontSize(opt.value)}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                  isSelected
                    ? "border-accent bg-accent/10 text-primary ring-1 ring-accent font-semibold"
                    : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Size */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Space size={14} className="text-secondary" />
          <label className="text-xs font-medium text-secondary block">
            {t.settings.diff.tabSizeTitle}
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tabSizeOptions.map((opt) => {
            const isSelected = diffTabSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`diff-tabsize-${opt.value}`}
                onClick={() => setDiffTabSize(opt.value)}
                className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                  isSelected
                    ? "border-accent bg-accent/10 text-primary ring-1 ring-accent font-semibold"
                    : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles: Whitespace & Line numbers */}
      <div className="pt-2 border-t border-border-subtle space-y-3">
        {/* Ignore Whitespace */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
          <div>
            <span className="text-xs font-semibold text-primary block">
              {t.settings.diff.whitespaceTitle}
            </span>
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

      {/* Live Preview Box */}
      <div className="pt-2">
        <label className="text-xs font-medium text-secondary block mb-2">
          Preview
        </label>
        <div
          className="rounded-lg border border-border-subtle bg-surface-header/40 p-3 font-mono overflow-x-auto leading-relaxed select-none"
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
                <span>  console.log(greeting);</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-red-400/90">- const greeting = "hello";</div>
              <div className="text-emerald-400/90">+ const greeting = "Hello, GitVista!";</div>
              <div className="text-secondary">  console.log(greeting);</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
