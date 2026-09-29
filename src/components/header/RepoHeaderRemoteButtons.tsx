import React from "react";
import clsx from "clsx";
import { RefreshCw, ArrowDown, ArrowUp } from "lucide-react";
import { type Translations } from "../../i18n/vi";
import { type useRemoteTask } from "../../features/remote/api";

interface RepoHeaderRemoteButtonsProps {
  t: Translations;
  actions: Translations["gitActions"]["simple"];
  remote: ReturnType<typeof useRemoteTask>;
  aheadCount: number;
  behindCount: number;
  hasUpstream: boolean;
}

/** The fetch/pull/push segmented button cluster in the repo header. */
export const RepoHeaderRemoteButtons: React.FC<RepoHeaderRemoteButtonsProps> = ({
  t,
  actions,
  remote,
  aheadCount,
  behindCount,
  hasUpstream,
}) => {
  const activeRemoteTask = remote.task;
  const isRemotePending = remote.isPending;

  return (
    <div className="inline-flex items-center bg-surface border border-border-subtle rounded-md p-0.5 shadow-2xs divide-x divide-border-subtle">
      {/* Fetch */}
      <button
        type="button"
        data-testid="btn-fetch"
        onClick={() => void remote.run("fetch")}
        disabled={isRemotePending}
        className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 btn-press"
        title={t.header.fetchTitle}
      >
        <RefreshCw
          size={12}
          className={
            isRemotePending && activeRemoteTask?.operation === "fetch" ? "animate-spin" : ""
          }
        />
        <span>{actions.fetch}</span>
      </button>

      {/* Pull */}
      <button
        type="button"
        data-testid="btn-pull"
        onClick={() => void remote.run("pull")}
        disabled={isRemotePending}
        className="flex items-center gap-1.5 px-2.5 py-1 text-secondary hover:text-primary hover:bg-surface-hover text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 btn-press"
        title={t.header.pullTitle}
      >
        <ArrowDown size={12} className="text-accent" />
        <span>{actions.pull}</span>
        {behindCount > 0 && (
          <span
            data-testid="behind-badge"
            className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 leading-none font-mono animate-scale-in"
            title={t.header.commitsBehind.replace("{count}", String(behindCount))}
          >
            {behindCount}
          </span>
        )}
      </button>

      {/* Push */}
      <button
        type="button"
        data-testid="btn-push"
        onClick={() => void remote.run("push")}
        disabled={isRemotePending}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50 btn-press",
          aheadCount > 0
            ? "bg-accent text-accent-contrast font-bold hover:bg-accent-hover rounded-r-xs"
            : "text-secondary hover:text-primary hover:bg-surface-hover font-medium"
        )}
        title={hasUpstream ? t.header.pushNormal : t.header.pushUpstream}
      >
        <ArrowUp size={12} />
        <span>{actions.push}</span>
        {aheadCount > 0 && (
          <span
            data-testid="ahead-badge"
            className="inline-flex items-center justify-center px-1.5 min-w-[15px] h-3.5 rounded-full text-[10px] font-bold bg-white/30 text-white leading-none font-mono animate-scale-in"
            title={t.header.commitsAhead.replace("{count}", String(aheadCount))}
          >
            {aheadCount}
          </span>
        )}
      </button>
    </div>
  );
};
