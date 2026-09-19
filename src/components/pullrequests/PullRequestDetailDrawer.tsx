import React, { useEffect, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  ArrowRight,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../i18n";
import { invokeCommand } from "../../ipc/client";
import { fetchPullRequestDetail } from "../../services/githubService";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useToastStore } from "../../store/useToastStore";
import { qk } from "../../domain/queryKeys";

interface PullRequestDetailDrawerProps {
  repoPath: string;
}

export const PullRequestDetailDrawer: React.FC<PullRequestDetailDrawerProps> = ({ repoPath }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isDrawerOpen, selectedPr, closeDrawer } = usePullRequestStore();
  const { showToast, showSuccess, showError } = useToastStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const { data: repoInfo } = useQuery({
    queryKey: qk.github.repoInfo(repoPath),
    queryFn: () => invokeCommand.getGitHubRepoInfo(repoPath),
    enabled: Boolean(repoPath),
  });

  const { data: token } = useQuery({
    queryKey: qk.githubToken(),
    queryFn: () => invokeCommand.getGitHubToken(),
  });

  // selectedPr?.number can be undefined before a PR is selected; `enabled` below
  // ensures the query only runs once there's a valid PR number, so ?? 0 is just a placeholder.
  const { data: detail } = useQuery({
    queryKey: qk.github.pullRequestDetail(repoPath, selectedPr?.number ?? 0),
    queryFn: () => {
      if (!repoInfo?.owner || !repoInfo?.repo || !selectedPr?.number) {
        throw new Error("Missing parameters for PR detail");
      }
      return fetchPullRequestDetail(repoInfo.owner, repoInfo.repo, selectedPr.number, token);
    },
    enabled: Boolean(isDrawerOpen && repoInfo?.owner && repoInfo?.repo && selectedPr?.number),
  });

  if (!isDrawerOpen || !selectedPr) return null;

  const pr = detail?.pr || selectedPr;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      showToast({ message: t.pullRequests.checkingOut, type: "info" });
      const res = await invokeCommand.checkoutPullRequest(repoPath, pr.number);
      showSuccess(t.pullRequests.checkoutSuccess.replace("{branch}", res.branch_name));
      queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
      queryClient.invalidateQueries({ queryKey: qk.commitGraph(repoPath) });
    } catch (err: any) {
      showError(err.message || "Lỗi khi checkout nhánh PR");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCopyLink = async () => {
    if (pr.html_url && navigator.clipboard) {
      await navigator.clipboard.writeText(pr.html_url);
      showSuccess(t.pullRequests.linkCopied);
    }
  };

  const getStatusBadge = () => {
    if (pr.merged_at) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 border border-purple-500/20">
          Merged
        </span>
      );
    }
    if (pr.state === "closed") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500 border border-red-500/20">
          Closed
        </span>
      );
    }
    if (pr.draft) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/15 text-zinc-500 border border-zinc-500/20">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
        Open
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="pr-drawer-backdrop"
        onClick={closeDrawer}
        className="fixed inset-0 modal-backdrop z-40 animate-fade-in"
      />

      {/* Slide-over Drawer */}
      <div
        data-testid="pull-request-detail-drawer"
        className="fixed top-0 right-0 bottom-0 z-50 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-macos flex flex-col overflow-hidden animate-slide-up w-[520px] max-w-[90vw]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-header/50 border-b border-border-subtle gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <GitPullRequest size={16} className="text-accent shrink-0" />
            <span className="font-mono text-sm font-bold text-accent shrink-0">#{pr.number}</span>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyLink}
              title={t.pullRequests.copyLink}
              className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
            >
              <Copy size={14} />
            </button>
            <a
              href={pr.html_url}
              target="_blank"
              rel="noreferrer"
              title={t.pullRequests.openInBrowser}
              className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={closeDrawer}
              title="Đóng (Esc)"
              className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 border-b border-border-subtle bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-secondary truncate">
            <span className="text-primary font-semibold truncate">{pr.head?.ref || "head"}</span>
            <ArrowRight size={12} className="shrink-0 text-tertiary" />
            <span className="text-secondary truncate">{pr.base?.ref || "base"}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
          >
            {isCheckingOut ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span>{isCheckingOut ? t.pullRequests.checkingOut : t.pullRequests.checkout}</span>
          </button>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title & Author */}
          <div>
            <h2 className="text-base font-bold text-primary mb-2">{pr.title}</h2>
            <div className="flex items-center gap-2 text-xs text-secondary">
              {pr.user?.avatar_url ? (
                <img
                  src={pr.user.avatar_url}
                  alt={pr.user.login}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center font-bold text-[10px] text-accent">
                  {pr.user?.login?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="font-semibold text-primary">@{pr.user?.login}</span>
              <span>•</span>
              <span>{new Date(pr.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Labels if any */}
          {pr.labels && pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pr.labels.map((l) => (
                <span
                  key={l.name}
                  style={{
                    backgroundColor: `#${l.color}20`,
                    borderColor: `#${l.color}50`,
                    color: `#${l.color}`,
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}

          {/* CI Checks Summary */}
          {detail && detail.check_runs && detail.check_runs.length > 0 && (
            <div className="p-3 bg-surface-header/40 border border-border-subtle rounded-xl space-y-2">
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent" />
                <span>{t.pullRequests.ciStatus}</span>
              </div>
              <div className="space-y-1.5">
                {detail.check_runs.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface border border-border-subtle"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {c.status === "success" && (
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      )}
                      {c.status === "failure" && (
                        <XCircle size={13} className="text-red-500 shrink-0" />
                      )}
                      {(c.status === "in_progress" || c.status === "queued") && (
                        <Clock size={13} className="text-amber-500 shrink-0" />
                      )}
                      <span className="truncate text-secondary font-mono text-[11px]">
                        {c.name}
                      </span>
                    </div>

                    {c.details_url && (
                      <a
                        href={c.details_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline text-[11px] shrink-0 ml-2"
                      >
                        Details
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
              {t.pullRequests.description}
            </h4>
            <div className="p-3.5 bg-surface-header/30 border border-border-subtle rounded-xl text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed min-h-[80px]">
              {detail?.body || (
                <span className="text-tertiary italic">{t.pullRequests.noDescription}</span>
              )}
            </div>
          </div>

          {/* Changed Files */}
          {detail && detail.files && detail.files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {t.pullRequests.filesChanged.replace("{count}", String(detail.files.length))}
              </h4>
              <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle bg-surface">
                {detail.files.map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center justify-between p-2.5 hover:bg-surface-hover text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode size={13} className="text-secondary shrink-0" />
                      <span
                        className="font-mono text-[11px] text-primary truncate"
                        title={file.filename}
                      >
                        {file.filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 ml-2">
                      {file.additions > 0 && (
                        <span className="text-emerald-500">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="text-red-500">-{file.deletions}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
