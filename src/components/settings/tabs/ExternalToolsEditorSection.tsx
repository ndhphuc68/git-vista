import React from "react";
import { Code2 } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Input } from "../../../shared/ui";
import { useSettingsStore, type DefaultEditor } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const ExternalToolsEditorSection: React.FC = () => {
  const { t } = useTranslation();
  const { defaultEditor, customEditorCommand, setDefaultEditor, setCustomEditorCommand } =
    useSettingsStore();

  const editorOptions: { value: DefaultEditor; label: string; desc: string }[] = [
    { value: "code", label: t.settings.tools.editorVsCode, desc: "Visual Studio Code" },
    { value: "cursor", label: t.settings.tools.editorCursor, desc: "AI First Code Editor" },
    { value: "subl", label: t.settings.tools.editorSublime, desc: "Sublime Text" },
    { value: "notepad++", label: t.settings.tools.editorNotepadPlusPlus, desc: "Notepad++" },
    {
      value: "custom",
      label: t.settings.tools.editorCustom,
      desc: t.settings.tools.editorCustomPlaceholder,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Code2 size={16} className="text-accent" />
        <div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-primary block">
              {t.settings.tools.editorTitle}
            </label>
            <HelpTooltip
              title={t.settings.help.toolsEditorTitle}
              description={t.settings.help.toolsEditorDesc}
              tag={t.settings.help.tagIntegration}
            />
          </div>
          <span className="text-[11px] text-secondary block">{t.settings.tools.editorDesc}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {editorOptions.map((opt) => {
          const isSelected = defaultEditor === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`editor-option-${opt.value}`}
              onClick={() => setDefaultEditor(opt.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              <div className="text-xs font-semibold text-primary flex items-center justify-between">
                <span>{opt.label}</span>
                {opt.value !== "custom" && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-secondary">
                    {opt.value}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-secondary mt-0.5">{opt.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Custom CLI command input if custom is chosen */}
      {defaultEditor === "custom" && (
        <div className="pt-1">
          <label className="text-xs font-medium text-secondary block mb-1.5">
            {t.settings.tools.editorCustom}
          </label>
          <Input
            size="md"
            mono
            data-testid="custom-editor-input"
            value={customEditorCommand}
            onChange={(e) => setCustomEditorCommand(e.target.value)}
            placeholder={t.settings.tools.editorCustomPlaceholder}
          />
        </div>
      )}
    </div>
  );
};
