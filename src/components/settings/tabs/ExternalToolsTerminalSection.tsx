import React from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type DefaultTerminal } from "../../../store/useSettingsStore";
import { HelpTooltip } from "../HelpTooltip";

export const ExternalToolsTerminalSection: React.FC = () => {
  const { t } = useTranslation();
  const { defaultTerminal, setDefaultTerminal } = useSettingsStore();

  const terminalOptions: { value: DefaultTerminal; label: string; command: string }[] = [
    { value: "wt", label: t.settings.tools.terminalWindowsTerminal, command: "wt -d ." },
    { value: "powershell", label: t.settings.tools.terminalPowerShell, command: "powershell" },
    { value: "cmd", label: t.settings.tools.terminalCmd, command: "cmd.exe" },
    { value: "bash", label: t.settings.tools.terminalGitBash, command: "bash.exe" },
  ];

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <TerminalIcon size={16} className="text-accent" />
        <div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-primary block">
              {t.settings.tools.terminalTitle}
            </label>
            <HelpTooltip
              title={t.settings.help.toolsTerminalTitle}
              description={t.settings.help.toolsTerminalDesc}
              tag={t.settings.help.tagIntegration}
            />
          </div>
          <span className="text-[11px] text-secondary block">{t.settings.tools.terminalDesc}</span>
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
  );
};
