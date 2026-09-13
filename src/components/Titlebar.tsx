import React from "react";
import { GitBranch, GitGraph, Sparkles } from "lucide-react";
import { useTranslation } from "../i18n";
import { useSettingsStore } from "../store/useSettingsStore";
import { useRepoStore } from "../store/useRepoStore";

export const Titlebar: React.FC = () => {
  const { t } = useTranslation();
  const mode = useSettingsStore((s) => s.mode);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const currentRepo = useRepoStore((s) => s.currentRepo);

  return (
    <header
      data-tauri-drag-region
      className="flex items-center justify-between h-[40px] px-4 bg-surface border-b border-border-subtle text-xs select-none shrink-0 transition-colors duration-200 ease-macos"
    >
      <div
        data-tauri-no-drag
        className="flex items-center gap-2 font-semibold text-primary"
      >
        <GitGraph size={16} className="text-accent shrink-0" />
        <span className="font-semibold text-primary">{currentRepo ? currentRepo.name : t.appTitle}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-sm bg-accent-subtle text-accent font-medium">
          {t.m1Badge}
        </span>
      </div>

      <div
        data-tauri-drag-region
        className="flex items-center gap-3 text-secondary text-xs"
      >
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="shrink-0 text-tertiary" />
          <span className="truncate max-w-[320px]">{currentRepo ? currentRepo.path : t.appTitle}</span>
        </div>
      </div>

      <div
        data-tauri-no-drag
        className="flex items-center gap-2"
      >
        <span className="text-xs px-2 py-0.5 rounded-sm border border-border-subtle bg-window text-secondary inline-flex items-center gap-1">
          <Sparkles size={11} className="text-accent" />
          {mode === "simple" ? "Chế độ: Đơn giản" : "Mode: Advanced"}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded-sm bg-window border border-border-subtle text-tertiary font-mono">
          {resolvedTheme.toUpperCase()}
        </span>
      </div>
    </header>
  );
};

