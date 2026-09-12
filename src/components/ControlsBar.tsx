import React, { useState } from "react";
import { Sun, Moon, Laptop, Eye, Languages, Terminal, RefreshCw, Cpu } from "lucide-react";
import { useSettingsStore, Theme, Locale } from "../store/useSettingsStore";
import { useTranslation } from "../i18n";
import { invokeCommand, RepoChangedPayload, SystemInfo } from "../ipc/client";

interface ControlsBarProps {
  lastEvent: RepoChangedPayload | null;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ lastEvent }) => {
  const { t, actions } = useTranslation();
  const {
    theme,
    colorblind,
    locale,
    mode,
    setTheme,
    setColorblind,
    setLocale,
    setMode,
  } = useSettingsStore();

  const [pingResult, setPingResult] = useState<string | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestIpc = async () => {
    setLoading(true);
    try {
      const pingRes = await invokeCommand.ping("Chào Rust backend từ React!");
      setPingResult(pingRes);

      const info = await invokeCommand.getSystemInfo();
      setSysInfo(info);
    } catch (err) {
      console.warn("IPC Error or Browser Fallback:", err);
      setPingResult(`Browser mock: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRepoChange = async () => {
    try {
      await invokeCommand.simulateRepoChange("d:/project-v3");
    } catch (err) {
      console.warn("Event simulate error:", err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background-color var(--duration-normal) var(--ease-macos)",
      }}
    >
      {/* Top Controls Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        {/* Left: Quick Actions sample preview based on mode */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent)",
              color: "var(--accent-contrast)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              minHeight: "var(--min-target-size)",
            }}
          >
            <RefreshCw size={12} />
            {actions.fetch}
          </button>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              minHeight: "var(--min-target-size)",
            }}
          >
            ↓ {actions.pull}
          </button>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              minHeight: "var(--min-target-size)",
            }}
          >
            ↑ {actions.push}
          </button>
        </div>

        {/* Right: Switchers */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          {/* Theme Switcher */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--bg-window)",
              padding: "2px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {(["light", "dark", "system"] as Theme[]).map((tVal) => (
              <button
                key={tVal}
                onClick={() => setTheme(tVal)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: theme === tVal ? "var(--bg-surface)" : "transparent",
                  color: theme === tVal ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: theme === tVal ? "var(--shadow-sm)" : "none",
                  fontWeight: theme === tVal ? 600 : 400,
                }}
                title={`Theme: ${tVal}`}
              >
                {tVal === "light" && <Sun size={12} />}
                {tVal === "dark" && <Moon size={12} />}
                {tVal === "system" && <Laptop size={12} />}
                <span>{tVal === "light" ? t.settings.themeLight : tVal === "dark" ? t.settings.themeDark : t.settings.themeSystem}</span>
              </button>
            ))}
          </div>

          {/* Colorblind Toggle */}
          <button
            onClick={() => setColorblind(!colorblind)}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: colorblind ? "var(--accent-subtle)" : "var(--bg-window)",
              color: colorblind ? "var(--accent)" : "var(--text-secondary)",
              minHeight: "var(--min-target-size)",
            }}
            title={t.settings.colorblind}
          >
            <Eye size={12} />
            <span>{t.settings.colorblind}: {colorblind ? t.settings.colorblindOn : t.settings.colorblindOff}</span>
          </button>

          {/* Language Switcher */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--bg-window)",
              padding: "2px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {(["vi", "en"] as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  backgroundColor: locale === loc ? "var(--bg-surface)" : "transparent",
                  color: locale === loc ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: locale === loc ? "var(--shadow-sm)" : "none",
                  fontWeight: locale === loc ? 600 : 400,
                }}
              >
                <Languages size={11} />
                <span>{loc.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Git Mode Switcher */}
          <button
            onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-window)",
              color: "var(--text-primary)",
              minHeight: "var(--min-target-size)",
            }}
          >
            <Terminal size={12} />
            <span>{mode === "simple" ? t.settings.modeSimple : t.settings.modeAdvanced}</span>
          </button>
        </div>
      </div>

      {/* IPC Test & Status Area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          backgroundColor: "var(--bg-window)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--font-size-xs)",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1 }}>
          <button
            onClick={handleTestIpc}
            disabled={loading}
            style={{
              padding: "3px 8px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-contrast)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 500,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {loading ? "Đang gọi..." : t.ipc.testButton}
          </button>

          <button
            onClick={handleSimulateRepoChange}
            style={{
              padding: "3px 8px",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 500,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {t.ipc.triggerEvent}
          </button>

          <span style={{ color: "var(--text-secondary)", fontStyle: pingResult ? "normal" : "italic" }}>
            {pingResult ? pingResult : "Chưa kiểm tra IPC"}
          </span>
        </div>

        {sysInfo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              color: "var(--text-tertiary)",
            }}
          >
            <Cpu size={12} />
            <span>OS: {sysInfo.os} ({sysInfo.arch})</span>
            <span>•</span>
            <span>{sysInfo.git_version}</span>
            <span>•</span>
            <span>App v{sysInfo.app_version}</span>
          </div>
        )}

        {lastEvent && (
          <span
            style={{
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Event: {lastEvent.reason}
          </span>
        )}
      </div>
    </div>
  );
};
