import React from "react";
import { ShieldCheck, Key } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Input } from "../../../shared/ui";
import { HelpTooltip } from "../HelpTooltip";

export interface GitProfileGpgSectionProps {
  activeScope: "global" | "repo";
  isOverride: boolean;
  gpgSign: boolean;
  onToggleGpgSign: () => void;
  gpgKey: string;
  onGpgKeyChange: (value: string) => void;
}

/** GPG commit signing toggle and signing-key field. */
export const GitProfileGpgSection: React.FC<GitProfileGpgSectionProps> = ({
  activeScope,
  isOverride,
  gpgSign,
  onToggleGpgSign,
  gpgKey,
  onGpgKeyChange,
}) => {
  const { t } = useTranslation();
  const disabled = activeScope === "repo" && !isOverride;

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-start gap-2">
        <ShieldCheck size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-semibold text-primary">{t.settings.profile.gpgTitle}</div>
            <HelpTooltip
              title={t.settings.help.profileGpgTitle}
              description={t.settings.help.profileGpgDesc}
              tag={t.settings.help.tagSafety}
            />
          </div>
          <p className="text-[11px] text-secondary mt-0.5">{t.settings.profile.gpgDesc}</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-header/20 border border-border-subtle">
        <label htmlFor="gpg-toggle" className="text-xs font-medium text-primary cursor-pointer">
          {t.settings.profile.gpgEnable}
        </label>
        <button
          id="gpg-toggle"
          type="button"
          role="switch"
          disabled={disabled}
          aria-checked={gpgSign}
          data-testid="toggle-gpg-sign"
          onClick={onToggleGpgSign}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
            gpgSign ? "bg-accent" : "bg-border-strong"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              gpgSign ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Key size={13} className="text-secondary" />
          <label htmlFor="gpg-key" className="text-xs font-medium text-primary">
            {t.settings.profile.gpgKeyLabel}
          </label>
        </div>
        <Input
          id="gpg-key"
          size="md"
          mono
          disabled={disabled}
          value={gpgKey}
          onChange={(e) => onGpgKeyChange(e.target.value)}
          placeholder={t.settings.profile.gpgKeyPlaceholder}
        />
      </div>
    </div>
  );
};
