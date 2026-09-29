import React from "react";
import { UserCheck } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { useSettingsStore, type AvatarStyle } from "../../../store/useSettingsStore";

export const AppearanceAvatarSection: React.FC = () => {
  const { t } = useTranslation();
  const { avatarStyle, setAvatarStyle } = useSettingsStore();

  const avatarOptions: { value: AvatarStyle; label: string }[] = [
    { value: "initials", label: t.settings.appearance.avatarInitials },
    { value: "gravatar", label: t.settings.appearance.avatarGravatar },
    { value: "none", label: t.settings.appearance.avatarNone },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UserCheck size={14} className="text-secondary" />
        <label className="text-xs font-medium text-secondary block">
          {t.settings.appearance.avatarTitle}
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {avatarOptions.map((opt) => {
          const isSelected = avatarStyle === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`avatar-style-${opt.value}`}
              onClick={() => setAvatarStyle(opt.value)}
              className={`p-3 rounded-lg border text-center transition-all text-xs font-medium ${
                isSelected
                  ? "border-accent bg-accent/10 text-primary ring-1 ring-accent"
                  : "border-border-subtle bg-surface-header/30 hover:bg-surface-hover text-secondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
