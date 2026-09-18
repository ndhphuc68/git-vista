import React, { useState } from "react";
import clsx from "clsx";
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
import { useSettingsStore, type Theme, type Locale } from "../store/useSettingsStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { useTranslation } from "../i18n";
import { invokeCommand, type RepoChangedPayload, type SystemInfo } from "../ipc/client";

interface ControlsBarProps {
  lastEvent: RepoChangedPayload | null;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ lastEvent }) => {
  const { t, actions } = useTranslation();
  const { theme, colorblind, locale, mode, setTheme, setColorblind, setLocale, setMode } =
    useSettingsStore();

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
      className="flex flex-col bg-surface border-b border-border-subtle transition-colors duration-200 ease-macos shrink-0"
    >
      {/* Top Compact Controls Row */}
      <div className="flex items-center justify-between px-3 py-1 min-h-[36px] gap-2 overflow-x-auto whitespace-nowrap">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="px-2.5 py-1 rounded-sm bg-accent text-accent-contrast text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-accent-hover active:scale-[0.98] transition-all">
            <RefreshCw size={11} />
            <span>{actions.fetch}</span>
          </button>
          <button className="px-2.5 py-1 rounded-sm bg-surface text-primary border border-border-subtle text-xs font-medium cursor-pointer hover:bg-surface-hover active:scale-[0.98] transition-all">
            ↓ {actions.pull}
          </button>
          <button className="px-2.5 py-1 rounded-sm bg-surface text-primary border border-border-subtle text-xs font-medium cursor-pointer hover:bg-surface-hover active:scale-[0.98] transition-all">
            ↑ {actions.push}
          </button>
        </div>

        {/* Right: Switchers & DevTools Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Switcher */}
          <div className="inline-flex bg-window p-0.5 rounded-md border border-border-subtle">
            {(["light", "dark", "system"] as Theme[]).map((tVal) => (
              <button
                key={tVal}
                onClick={() => setTheme(tVal)}
                className={clsx(
                  "px-1.5 py-0.5 rounded-sm text-xs flex items-center gap-1 cursor-pointer transition-colors",
                  theme === tVal
                    ? "bg-surface text-primary shadow-sm font-semibold"
                    : "bg-transparent text-secondary hover:text-primary font-normal"
                )}
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
            className={clsx(
              "px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle cursor-pointer transition-colors",
              colorblind
                ? "bg-accent-subtle text-accent font-medium"
                : "bg-window text-secondary hover:text-primary"
            )}
            title={t.settings.colorblind}
          >
            <Eye size={11} />
            <span>{colorblind ? t.settings.colorblindOn : t.settings.colorblindOff}</span>
          </button>

          {/* Language Switcher */}
          <div className="inline-flex bg-window p-0.5 rounded-md border border-border-subtle">
            {(["vi", "en"] as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={clsx(
                  "px-1.5 py-0.5 rounded-sm text-xs flex items-center gap-0.5 cursor-pointer transition-colors",
                  locale === loc
                    ? "bg-surface text-primary shadow-sm font-semibold"
                    : "bg-transparent text-secondary hover:text-primary font-normal"
                )}
              >
                <Languages size={11} />
                <span>{loc.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Git Mode Switcher */}
          <button
            onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}
            className="px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle bg-window text-primary cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <Terminal size={11} />
            <span>{mode === "simple" ? t.settings.modeSimple : t.settings.modeAdvanced}</span>
          </button>

          {/* DevTools Toggle Button */}
          <button
            type="button"
            data-testid="toggle-devtools"
            onClick={toggleDevTools}
            className={clsx(
              "px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1 border border-border-subtle cursor-pointer transition-colors",
              devToolsOpen
                ? "bg-accent-subtle text-accent font-medium"
                : "bg-window text-secondary hover:text-primary"
            )}
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
          className="flex items-center justify-between px-3 py-1 bg-window border-t border-border-subtle text-xs gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <button
              onClick={handleTestIpc}
              disabled={loading}
              className="px-2 py-0.5 bg-accent text-accent-contrast rounded-sm font-medium text-xs cursor-pointer shrink-0 disabled:opacity-50 hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              {loading ? "Đang gọi..." : t.ipc.testButton}
            </button>

            <button
              onClick={handleSimulateRepoChange}
              className="px-2 py-0.5 bg-surface text-primary border border-border-subtle rounded-sm font-medium text-xs cursor-pointer shrink-0 hover:bg-surface-hover active:scale-[0.98] transition-all"
            >
              {t.ipc.triggerEvent}
            </button>

            <span
              className={clsx(
                "text-secondary overflow-hidden text-ellipsis whitespace-nowrap",
                !pingResult && "italic"
              )}
            >
              {pingResult ? pingResult : "Chưa kiểm tra IPC"}
            </span>
          </div>

          {sysInfo && (
            <div className="flex items-center gap-2 text-tertiary shrink-0">
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
            <span className="bg-accent-subtle text-accent px-1.5 py-0.5 rounded-sm shrink-0">
              Event: {lastEvent.reason}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
