import React, { useState } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Eye,
  Languages,
  Terminal,
  RefreshCw,
  Cpu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSettingsStore, Theme, Locale } from "../store/useSettingsStore";
import { useLayoutStore } from "../store/useLayoutStore";
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

  const { devToolsOpen, toggleDevTools } = useLayoutStore();

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
      data-testid="controls-bar"
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "background-color var(--duration-normal) var(--ease-macos)",
        flexShrink: 0,
      }}
    >
      {/* Top Compact Controls Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px",
          minHeight: "36px",
          gap: "8px",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {/* Left: Quick Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <button
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent)",
              color: "var(--accent-contrast)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={11} />
            <span>{actions.fetch}</span>
          </button>
          <button
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ↓ {actions.pull}
          </button>
          <button
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ↑ {actions.push}
          </button>
        </div>

        {/* Right: Switchers & DevTools Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
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
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  backgroundColor:
                    theme === tVal ? "var(--bg-surface)" : "transparent",
                  color:
                    theme === tVal
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  boxShadow: theme === tVal ? "var(--shadow-sm)" : "none",
                  fontWeight: theme === tVal ? 600 : 400,
                  cursor: "pointer",
                }}
                title={`Theme: ${tVal}`}
              >
                {tVal === "light" && <Sun size={11} />}
                {tVal === "dark" && <Moon size={11} />}
                {tVal === "system" && <Laptop size={11} />}
                <span>
                  {tVal === "light"
                    ? t.settings.themeLight
                    : tVal === "dark"
                    ? t.settings.themeDark
                    : t.settings.themeSystem}
                </span>
              </button>
            ))}
          </div>

          {/* Colorblind Toggle */}
          <button
            onClick={() => setColorblind(!colorblind)}
            style={{
              padding: "3px 6px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: colorblind
                ? "var(--accent-subtle)"
                : "var(--bg-window)",
              color: colorblind ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
            title={t.settings.colorblind}
          >
            <Eye size={11} />
            <span>
              {colorblind ? t.settings.colorblindOn : t.settings.colorblindOff}
            </span>
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
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  backgroundColor:
                    locale === loc ? "var(--bg-surface)" : "transparent",
                  color:
                    locale === loc
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  boxShadow: locale === loc ? "var(--shadow-sm)" : "none",
                  fontWeight: locale === loc ? 600 : 400,
                  cursor: "pointer",
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
              padding: "3px 6px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-window)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <Terminal size={11} />
            <span>
              {mode === "simple" ? t.settings.modeSimple : t.settings.modeAdvanced}
            </span>
          </button>

          {/* DevTools Toggle Button */}
          <button
            type="button"
            data-testid="toggle-devtools"
            onClick={toggleDevTools}
            style={{
              padding: "3px 6px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: devToolsOpen
                ? "var(--accent-subtle)"
                : "var(--bg-window)",
              color: devToolsOpen ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
            title="Công cụ nhà phát triển & IPC"
          >
            <Cpu size={11} />
            <span>Dev</span>
            {devToolsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* IPC Test & Status Area (Collapsible Drawer) */}
      {devToolsOpen && (
        <div
          data-testid="devtools-drawer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 12px",
            backgroundColor: "var(--bg-window)",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "var(--font-size-xs)",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <button
              onClick={handleTestIpc}
              disabled={loading}
              style={{
                padding: "2px 8px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-contrast)",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: "var(--font-size-xs)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {loading ? "Đang gọi..." : t.ipc.testButton}
            </button>

            <button
              onClick={handleSimulateRepoChange}
              style={{
                padding: "2px 8px",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: "var(--font-size-xs)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {t.ipc.triggerEvent}
            </button>

            <span
              style={{
                color: "var(--text-secondary)",
                fontStyle: pingResult ? "normal" : "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
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
                flexShrink: 0,
              }}
            >
              <Cpu size={12} />
              <span>
                OS: {sysInfo.os} ({sysInfo.arch})
              </span>
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
                flexShrink: 0,
              }}
            >
              Event: {lastEvent.reason}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
