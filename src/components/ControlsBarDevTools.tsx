import React from "react";
import clsx from "clsx";
import { Cpu } from "lucide-react";
import { type RepoChangedPayload, type SystemInfo } from "../ipc/client";
import { type Translations } from "../i18n/vi";
import { Button } from "../shared/ui";

interface ControlsBarDevToolsProps {
  t: Translations;
  loading: boolean;
  pingResult: string | null;
  sysInfo: SystemInfo | null;
  lastEvent: RepoChangedPayload | null;
  onTestIpc: () => Promise<void>;
  onSimulateRepoChange: () => Promise<void>;
}

/** Collapsible devtools drawer: manual IPC test button, ping result and repo-changed simulator. */
export const ControlsBarDevTools: React.FC<ControlsBarDevToolsProps> = ({
  t,
  loading,
  pingResult,
  sysInfo,
  lastEvent,
  onTestIpc,
  onSimulateRepoChange,
}) => {
  return (
    <div
      data-testid="devtools-drawer"
      className="flex items-center justify-between px-3 py-1 bg-window border-t border-border-subtle text-xs gap-3 flex-wrap"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <Button onClick={onTestIpc} disabled={loading} className="shrink-0">
          {loading ? "Đang gọi..." : t.ipc.testButton}
        </Button>

        <Button variant="secondary" onClick={onSimulateRepoChange} className="shrink-0">
          {t.ipc.triggerEvent}
        </Button>

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
  );
};
