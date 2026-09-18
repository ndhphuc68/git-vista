import React, { useState, useEffect, useRef } from "react";
import { GitPullRequest, GitBranch, ArrowRight, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../ipc/client";
import { createPullRequest } from "../../services/githubService";
import { usePullRequestStore } from "../../store/usePullRequestStore";
import { useToastStore } from "../../store/useToastStore";
import { useTranslation } from "../../i18n";
import { Transition } from "../common/Transition";

export interface CreatePullRequestModalProps {
  repoPath: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CreatePullRequestModal: React.FC<CreatePullRequestModalProps> = ({
  repoPath,
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const storeIsOpen = usePullRequestStore((s) => s.isCreateModalOpen);
  const storeClose = usePullRequestStore((s) => s.closeCreateModal);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : storeIsOpen;
  const handleClose = propsOnClose !== undefined ? propsOnClose : storeClose;

  const [baseBranch, setBaseBranch] = useState("");
  const [compareBranch, setCompareBranch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);
  const userChangedBaseRef = useRef(false);
  const userChangedCompareRef = useRef(false);

  // Fetch GitHub repo info (owner, repo, default_branch)
  const { data: repoInfo } = useQuery({
    queryKey: ["github-repo-info", repoPath],
    queryFn: () => invokeCommand.getGitHubRepoInfo(repoPath),
    enabled: isOpen,
    staleTime: 60_000,
  });

  // Fetch branches
  const { data: branchData, refetch: refetchBranches } = useQuery({
    queryKey: ["branches", repoPath],
    queryFn: () => invokeCommand.getBranches(repoPath),
    enabled: isOpen,
    staleTime: 30_000,
  });

  // Reset form only when modal opens
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setTitle("");
      setBody("");
      setIsDraft(false);
      setError(null);
      setSubmitting(false);
      setIsPushing(false);
      userChangedBaseRef.current = false;
      userChangedCompareRef.current = false;
      setBaseBranch(repoInfo?.default_branch || "main");
      setCompareBranch(branchData?.current_branch || "main");

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 60);
    } else if (!isOpen && prevOpenRef.current) {
      setBaseBranch("");
      setCompareBranch("");
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  // Set default branches when query data loads if user hasn't manually selected
  useEffect(() => {
    if (isOpen) {
      if (!userChangedBaseRef.current && repoInfo?.default_branch) {
        setBaseBranch(repoInfo.default_branch);
      }
      if (!userChangedCompareRef.current && branchData?.current_branch) {
        setCompareBranch(branchData.current_branch);
      }
    }
  }, [isOpen, repoInfo?.default_branch, branchData?.current_branch]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Check if compare branch has unpushed commits
  const currentCompareBranchItem = branchData?.local.find(
    (b) => b.name === compareBranch
  );
  const hasUnpushedCommits =
    currentCompareBranchItem &&
    (currentCompareBranchItem.ahead > 0 || !currentCompareBranchItem.upstream);

  // Available base branch candidates: remote branches + local branches (deduplicated)
  const availableBaseBranches = Array.from(
    new Set([
      ...(repoInfo?.default_branch ? [repoInfo.default_branch] : ["main"]),
      ...(branchData?.remote.map((b) => b.name.replace(/^origin\//, "")) || []),
      ...(branchData?.local.map((b) => b.name) || []),
    ])
  );

  // Available compare branch candidates
  const availableCompareBranches = Array.from(
    new Set(branchData?.local.map((b) => b.name) || [compareBranch])
  );

  const handlePushBranch = async () => {
    if (!compareBranch) return;
    setIsPushing(true);
    setError(null);
    try {
      const hasUpstream = Boolean(currentCompareBranchItem?.upstream);
      await invokeCommand.pushRepo(
        repoPath,
        undefined,
        compareBranch,
        !hasUpstream,
        false
      );
      await refetchBranches();
      useToastStore.getState().showToast({
        message: "Push thành công",
        type: "success",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsPushing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const owner = repoInfo?.owner;
    const repo = repoInfo?.repo;
    if (!repoInfo?.is_github || !owner || !repo) {
      setError(t.pullRequests.notGitHub);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await invokeCommand.getGitHubToken();
      if (!token) {
        setError(t.pullRequests.needToken);
        setSubmitting(false);
        return;
      }

      const newPr = await createPullRequest(
        owner,
        repo,
        {
          title: trimmedTitle,
          head: compareBranch,
          base: baseBranch,
          body: body.trim(),
          draft: isDraft,
        },
        token
      );

      useToastStore.getState().showToast({
        message: t.pullRequests.createSuccess.replace(
          "{number}",
          String(newPr.number)
        ),
        type: "success",
      });

      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (part) =>
              typeof part === "string" && part.includes("github-pull-requests")
          ),
      });

      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition
      show={isOpen}
      className="fixed inset-0 z-[9999]"
      enterClass="animate-fade-in"
      exitClass="opacity-0 transition-opacity duration-180 ease-macos pointer-events-none"
      unmountOnExit={true}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-pr-title"
      >
        <div
          className="bg-surface rounded-xl border border-border-subtle w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <GitPullRequest size={16} />
              </div>
              <div>
                <h3
                  id="create-pr-title"
                  className="text-sm font-semibold text-primary m-0 leading-tight"
                >
                  {t.pullRequests.createModalTitle}
                </h3>
                {repoInfo?.owner && repoInfo?.repo && (
                  <p className="text-[11px] text-secondary m-0 leading-tight mt-0.5 font-mono">
                    {repoInfo.owner}/{repoInfo.repo}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1.5 rounded-md transition-colors"
              aria-label={t.common.close}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Branch Selection Bar */}
            <div className="p-3 bg-window rounded-lg border border-border-subtle flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label
                  htmlFor="base-branch-select"
                  className="block text-[11px] font-medium text-secondary mb-1"
                >
                  {t.pullRequests.baseBranch}
                </label>
                <div className="relative">
                  <select
                    id="base-branch-select"
                    aria-label={t.pullRequests.baseBranch}
                    value={baseBranch}
                    onChange={(e) => {
                      setBaseBranch(e.target.value);
                      userChangedBaseRef.current = true;
                    }}
                    disabled={submitting}
                    className="w-full bg-surface text-primary border border-border-subtle rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-accent transition-colors cursor-pointer appearance-none pr-8"
                  >
                    {availableBaseBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <GitBranch
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center shrink-0 pt-3 sm:pt-4 text-secondary">
                <ArrowRight size={16} />
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="compare-branch-select"
                  className="block text-[11px] font-medium text-secondary mb-1"
                >
                  {t.pullRequests.compareBranch}
                </label>
                <div className="relative">
                  <select
                    id="compare-branch-select"
                    aria-label={t.pullRequests.compareBranch}
                    value={compareBranch}
                    onChange={(e) => {
                      setCompareBranch(e.target.value);
                      userChangedCompareRef.current = true;
                    }}
                    disabled={submitting}
                    className="w-full bg-surface text-primary border border-border-subtle rounded-md px-2.5 py-1.5 text-xs font-mono outline-none focus:border-accent transition-colors cursor-pointer appearance-none pr-8"
                  >
                    {availableCompareBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <GitBranch
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Unpushed Warning Banner */}
            {hasUnpushedCommits && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{t.pullRequests.unpushedWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={handlePushBranch}
                  disabled={isPushing || submitting}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded border border-amber-500/30 font-medium text-[11px] cursor-pointer transition-colors shrink-0"
                >
                  {isPushing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  <span>{t.pullRequests.pushFirst}</span>
                </button>
              </div>
            )}

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pr-title-input"
                className="text-xs font-medium text-primary"
              >
                {t.pullRequests.prTitle}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="pr-title-input"
                aria-label={t.pullRequests.prTitle}
                type="text"
                placeholder={t.pullRequests.prTitlePlaceholder}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                disabled={submitting}
                className="bg-window text-primary border border-border-subtle rounded-md px-3 py-2 text-xs outline-none focus:border-accent transition-colors w-full"
              />
            </div>

            {/* Body Textarea */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pr-body-input"
                className="text-xs font-medium text-primary"
              >
                {t.pullRequests.prBody}
              </label>
              <textarea
                id="pr-body-input"
                aria-label={t.pullRequests.prBody}
                rows={5}
                placeholder={t.pullRequests.prBodyPlaceholder}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={submitting}
                className="bg-window text-primary border border-border-subtle rounded-md px-3 py-2 text-xs outline-none focus:border-accent transition-colors w-full resize-y font-sans leading-relaxed"
              />
            </div>

            {/* Draft PR Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-primary select-none">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                disabled={submitting}
                aria-label={t.pullRequests.isDraft}
                className="accent-accent cursor-pointer rounded"
              />
              <span>{t.pullRequests.isDraft}</span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-lg text-diff-remove-text text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-transparent border border-border-subtle rounded-md text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t.pullRequests.creating}</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest size={13} />
                    <span>{t.pullRequests.submitCreate}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  );
};
