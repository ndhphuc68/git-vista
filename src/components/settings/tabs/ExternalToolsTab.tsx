import React from "react";
import { Code2, Terminal as TerminalIcon } from "lucide-react";
import { useTranslation } from "../../../i18n";
import {
  useSettingsStore,
  DefaultEditor,
  DefaultTerminal,
} from "../../../store/useSettingsStore";

export const ExternalToolsTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    defaultEditor,
    customEditorCommand,
    defaultTerminal,
    setDefaultEditor,
    setCustomEditorCommand,
    setDefaultTerminal,
  } = useSettingsStore();

  const editorOptions: { value: DefaultEditor; label: string; desc: string }[] = [
    { value: "code", label: t.settings.tools.editorVsCode, desc: "Visual Studio Code" },
    { value: "cursor", label: t.settings.tools.editorCursor, desc: "AI First Code Editor" },
    { value: "subl", label: t.settings.tools.editorSublime, desc: "Sublime Text" },
    { value: "notepad++", label: t.settings.tools.editorNotepadPlusPlus, desc: "Notepad++" },
    { value: "custom", label: t.settings.tools.editorCustom, desc: t.settings.tools.editorCustomPlaceholder },
  ];

  const terminalOptions: { value: DefaultTerminal; label: string; command: string }[] = [
    { value: "wt", label: t.settings.tools.terminalWindowsTerminal, command: "wt -d ." },
    { value: "powershell", label: t.settings.tools.terminalPowerShell, command: "powershell" },
    { value: "cmd", label: t.settings.tools.terminalCmd, command: "cmd.exe" },
    { value: "bash", label: t.settings.tools.terminalGitBash, command: "bash.exe" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-primary mb-1">
          {t.settings.tools.title}
        </h3>
        <p className="text-xs text-secondary">
          {t.settings.tools.subtitle}
        </p>
      </div>

      {/* Editor Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-accent" />
          <div>
            <label className="text-xs font-semibold text-primary block">
              {t.settings.tools.editorTitle}
            </label>
            <span className="text-[11px] text-secondary block">
              {t.settings.tools.editorDesc}
            </span>
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
            <input
              type="text"
              data-testid="custom-editor-input"
              value={customEditorCommand}
              onChange={(e) => setCustomEditorCommand(e.target.value)}
              placeholder={t.settings.tools.editorCustomPlaceholder}
              className="w-full px-3 py-2 text-xs rounded-md bg-surface-input border border-border-subtle focus:border-accent focus:outline-none text-primary transition-colors font-mono"
            />
          </div>
        )}
      </div>

      {/* Terminal Section */}
      <div className="pt-3 border-t border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-accent" />
          <div>
            <label className="text-xs font-semibold text-primary block">
              {t.settings.tools.terminalTitle}
            </label>
            <span className="text-[11px] text-secondary block">
              {t.settings.tools.terminalDesc}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {terminalOptions.map((opt) => {
            const isSelected = defaultTerminal === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`terminal-option-${opt.value}`}
                onClick={() => setDefaultTerminal(opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                    : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
                }`}
              >
                <div className="text-xs font-semibold text-primary flex items-center justify-between">
                  <span>{opt.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-secondary">
                    {opt.command}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
