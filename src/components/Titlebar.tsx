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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "40px",
        padding: "0 var(--space-4)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: "var(--font-size-sm)",
        transition: "background-color var(--duration-normal) var(--ease-macos)",
      }}
    >
      <div
        data-tauri-no-drag
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        <GitGraph size={16} color="var(--accent)" />
        <span>{currentRepo ? currentRepo.name : t.appTitle}</span>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--accent-subtle)",
            color: "var(--accent)",
            fontWeight: 500,
          }}
        >
          {t.m1Badge}
        </span>
      </div>

      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <GitBranch size={13} />
          <span>{currentRepo ? currentRepo.path : t.appTitle}</span>
        </div>
      </div>

      <div
        data-tauri-no-drag
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Sparkles size={11} />
          {mode === "simple" ? "Chế độ: Đơn giản" : "Mode: Advanced"}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--text-tertiary)",
          }}
        >
          {resolvedTheme.toUpperCase()}
        </span>
      </div>
    </header>
  );
};

