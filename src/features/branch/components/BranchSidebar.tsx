import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GitBranch,
  Cloud,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Plus,
  Settings2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepoStore } from "../../../store/useRepoStore";
import { useViewStore } from "../../../store/useViewStore";
import { invokeCommand } from "../../../ipc/client";
import { type StashItem, type TagItem } from "../../../ipc/bindings.generated";
import { useToastStore } from "../../../store/useToastStore";
import { mapGitError } from "../../../utils/errorMapping";
import { qk } from "../../../domain/queryKeys";
// Sibling modules directly, not through ../index — the barrel re-exports this
// file, so going through it would create an import cycle.
import { CreateBranchModal } from "./CreateBranchModal";
import { RenameBranchModal } from "./RenameBranchModal";
import { DeleteBranchModal } from "./DeleteBranchModal";
import { CheckoutConflictModal } from "./CheckoutConflictModal";
import { BranchTreeNode as BranchTreeNodeView } from "./BranchTreeNode";
import { RemoteTreeNode } from "./RemoteTreeNode";
import { TagSection } from "./TagSection";
import { StashSection } from "./StashSection";
import { PullRequestsSection } from "../../../components/sidebar/PullRequestsSection";
import { StashDiffView } from "../../../features/stash";
import { MergeBranchModal } from "../../../components/merge/MergeBranchModal";
import { RebaseBranchModal } from "../../../components/merge/RebaseBranchModal";
import { CreateTagModal, DeleteTagModal } from "../../../features/tag";
import { CompareModal } from "../../../components/compare";
import {
  AddEditRemoteModal,
  DeleteRemoteModal,
  ManageRemotesModal,
  PruneConfirmModal,
} from "../../remote";
import { useTranslation } from "../../../i18n";
import { buildBranchTree, type BranchTreeNode } from "../model/branchTree";
import { NO_DIALOG, isDialog, type SidebarDialog } from "../model/sidebarDialog";
import { useBranches, useCheckoutBranch } from "../api";
import { useApplyStash, useDropStash, usePopStash } from "../../stash/api";

export const BranchSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { currentRepo, selectedBranch, setSelectedBranch } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const queryClient = useQueryClient();
  const checkoutBranch = useCheckoutBranch(currentRepo?.path ?? "");

  const [search, setSearch] = useState("");
  const [localOpen, setLocalOpen] = useState(true);
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [stashOpen, setStashOpen] = useState(false);
  const [selectedStash, setSelectedStash] = useState<StashItem | null>(null);

  // One slot for every dialog: opening one necessarily closes the other, so
  // the "two dialogs open at once" states the old flags allowed cannot arise.
  const [dialog, setDialog] = useState<SidebarDialog>(NO_DIALOG);
  const closeDialog = () => setDialog(NO_DIALOG);

  // Context / Action menu state (strictly 1 active menu at any time)
  type ActiveSidebarMenu =
    | { type: "branch"; name: string }
    | { type: "remote"; name: string }
    | { type: "tag"; name: string }
    | null;

  const [activeMenu, setActiveMenu] = useState<ActiveSidebarMenu>(null);
  const activeMenuRef = useRef<HTMLDivElement>(null);

  const menuBranch = activeMenu?.type === "branch" ? activeMenu.name : null;
  const remoteMenuName = activeMenu?.type === "remote" ? activeMenu.name : null;
  const tagMenuOpenName = activeMenu?.type === "tag" ? activeMenu.name : null;

  const setMenuBranch = (name: string | null) => {
    setActiveMenu(name ? { type: "branch", name } : null);
  };
  const setRemoteMenuName = (name: string | null) => {
    setActiveMenu(name ? { type: "remote", name } : null);
  };
  const setTagMenuOpenName = (name: string | null) => {
    setActiveMenu(name ? { type: "tag", name } : null);
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const { data: branchData } = useBranches(currentRepo?.path ?? "");

  const { data: remotesList = [] } = useQuery({
    queryKey: qk.remotes(currentRepo?.path ?? ""),
    queryFn: () => invokeCommand.getRemotes(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  const { data: repoStatus } = useQuery({
    queryKey: qk.repo.status(currentRepo?.path ?? ""),
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  const hasUncommittedChanges = Boolean(
    repoStatus &&
    (repoStatus.staged.length > 0 ||
      repoStatus.unstaged.length > 0 ||
      repoStatus.untracked.length > 0)
  );

  const currentBranchName =
    branchData?.current_branch ||
    branchData?.local.find((b) => b.is_head)?.name ||
    selectedBranch ||
    "main";

  const { data: stashes = [] } = useQuery({
    queryKey: qk.stashes(currentRepo?.path ?? ""),
    queryFn: () => invokeCommand.getStashes(currentRepo!.path),
    enabled: !!currentRepo?.path,
  });

  const { data: tagItems = [] } = useQuery({
    queryKey: qk.tags(currentRepo?.path ?? ""),
    queryFn: () => invokeCommand.getTags(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const localBranches = (branchData?.local || []).filter((branch) =>
    branch.name.toLowerCase().includes(search.toLowerCase())
  );
  const remoteBranches = (branchData?.remote || []).filter((branch) =>
    branch.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTags = tagItems.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );
  const branchTree = useMemo(() => buildBranchTree(localBranches), [localBranches]);
  const remoteBranchTree = useMemo(() => buildBranchTree(remoteBranches), [remoteBranches]);

  // Stash commands come from features/stash. The wrappers below keep the
  // confirm prompt, the undo toast and the error style that the sidebar had
  // before — none of that belongs in a mutation hook.
  const applyStashMutation = useApplyStash(currentRepo?.path ?? "");
  const popStashMutation = usePopStash(currentRepo?.path ?? "");
  const dropStashMutation = useDropStash(currentRepo?.path ?? "");

  if (!currentRepo) return null;

  const handleApplyStash = async (index: number) => {
    try {
      await applyStashMutation.mutateAsync({ index });
    } catch (err: unknown) {
      alert(`Khong the ap dung stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePopStash = async (index: number) => {
    try {
      await popStashMutation.mutateAsync({ index });
      setSelectedStash(null);
    } catch (err: unknown) {
      alert(`Khong the pop stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDropStash = async (index: number) => {
    if (!window.confirm("Xoa stash nay?")) return;
    const stashToDrop = stashes[index];
    try {
      const receipt = await dropStashMutation.mutateAsync({ index });
      setSelectedStash(null);
      if (stashToDrop) {
        useToastStore.getState().showToast({
          message: `Đã xoá stash@{${index}}`,
          type: "success",
          durationMs: 10000,
          undoAction: async () => {
            await invokeCommand.undoDropStash(currentRepo.path, receipt);
            queryClient.invalidateQueries({ queryKey: qk.stashes(currentRepo.path) });
          },
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  const invalidateRepo = () => {
    queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.repo.status(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.repo.head(currentRepo.path) });
  };

  /** Remote edits change the remote list and the remote-tracking branches. */
  const invalidateRemotes = () => {
    queryClient.invalidateQueries({ queryKey: qk.remotes(currentRepo.path) });
    queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
  };

  const handleCheckoutTag = async (tag: TagItem) => {
    setTagMenuOpenName(null);
    try {
      await invokeCommand.checkoutTag(currentRepo.path, tag.name);
      useToastStore.getState().showToast({
        message: t.sidebar.checkoutTagSuccess.replace("{name}", tag.name),
        type: "success",
      });
      invalidateRepo();
      // checkoutTag has no feature hook yet, so it must refresh tags itself.
      queryClient.invalidateQueries({ queryKey: qk.tags(currentRepo.path) });
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  const handlePushTag = async (tag: TagItem) => {
    setTagMenuOpenName(null);
    try {
      await invokeCommand.pushTag(currentRepo.path, tag.name);
      useToastStore.getState().showToast({
        message: t.sidebar.pushTagSuccess.replace("{name}", tag.name),
        type: "success",
      });
      invalidateRepo();
      // pushTag has no feature hook yet, so it must refresh tags itself.
      queryClient.invalidateQueries({ queryKey: qk.tags(currentRepo.path) });
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  const handleCheckout = async (branchName: string) => {
    setMenuBranch(null);
    try {
      // invalidateRepo is gone from here: useCheckoutBranch owns invalidation.
      await checkoutBranch.mutateAsync({ name: branchName });
      setSelectedBranch(branchName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("CHECKOUT_CONFLICT") || msg.toLowerCase().includes("conflict")) {
        setDialog({
          kind: "checkoutConflict",
          targetBranch: branchName,
          errorMessage: msg,
        });
      } else {
        alert(`Không thể chuyển nhánh: ${msg}`);
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false,
    }));
  };

  const renderTreeNode = (node: BranchTreeNode) => (
    <BranchTreeNodeView
      key={node.fullPath}
      node={node}
      search={search}
      expandedFolders={expandedFolders}
      onToggleFolder={toggleFolder}
      selectedBranch={selectedBranch}
      onSelectBranch={setSelectedBranch}
      menuBranch={menuBranch}
      onSetMenuBranch={setMenuBranch}
      menuRef={activeMenuRef}
      currentBranchName={currentBranchName}
      onCheckout={handleCheckout}
      onMerge={(name) => setDialog({ kind: "merge", targetBranch: name })}
      onRebase={(name) => setDialog({ kind: "rebase", upstreamBranch: name })}
      onCompare={(name) =>
        setDialog({ kind: "compare", baseRev: currentBranchName, targetRev: name })
      }
      onRename={(name) => setDialog({ kind: "renameBranch", name })}
      onDelete={(name) => setDialog({ kind: "deleteBranch", name })}
    />
  );

  const renderRemoteTreeNode = (node: BranchTreeNode, depth: number = 0) => (
    <RemoteTreeNode
      key={node.fullPath}
      node={node}
      depth={depth}
      search={search}
      expandedFolders={expandedFolders}
      onToggleFolder={toggleFolder}
      selectedBranch={selectedBranch}
      onSelectBranch={setSelectedBranch}
      menuBranch={menuBranch}
      onSetMenuBranch={setMenuBranch}
      remoteMenuName={remoteMenuName}
      onSetRemoteMenuName={setRemoteMenuName}
      menuRef={activeMenuRef}
      remotesList={remotesList}
      currentBranchName={currentBranchName}
      onCheckout={handleCheckout}
      onOpenDialog={setDialog}
    />
  );

  return (
    <>
      <aside className="bg-surface border-r border-border-subtle w-full shrink-0 h-full flex flex-col overflow-y-auto">
        <div className="px-3 py-2 border-b border-border-subtle bg-surface">
          <div className="group relative flex items-center gap-2 bg-window/80 hover:bg-window focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/20 border border-border-subtle focus-within:border-accent rounded-md px-2.5 py-1.5 transition-all duration-150 shadow-2xs">
            <Search
              size={13}
              className="text-tertiary group-focus-within:text-accent shrink-0 transition-colors"
            />
            <input
              type="text"
              placeholder={t.sidebar.searchPlaceholder}
              aria-label={t.sidebar.searchAria}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  e.currentTarget.blur();
                }
              }}
              className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-xs text-primary placeholder:text-tertiary w-full leading-normal selection:bg-accent/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t.sidebar.clearSearchAria}
                title={t.sidebar.clearSearchTitle}
                className="p-0.5 -mr-1 text-tertiary hover:text-primary hover:bg-surface-hover rounded-full cursor-pointer transition-colors flex items-center justify-center border-0 bg-transparent"
              >
                <X size={12} />
              </button>
            ) : (
              <kbd className="hidden group-hover:inline-block group-focus-within:hidden text-[10px] font-mono text-tertiary/70 bg-surface border border-border-subtle/80 rounded px-1.5 py-0.2 select-none pointer-events-none transition-opacity">
                /
              </kbd>
            )}
          </div>
        </div>

        <div className="p-2 flex flex-col gap-3">
          {/* BRANCHES */}
          <div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLocalOpen(!localOpen)}
                aria-expanded={localOpen}
                aria-label={t.sidebar.branches}
                className="flex items-center gap-1.5 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
              >
                {localOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <GitBranch size={13} />
                <span>
                  {t.sidebar.branches} ({localBranches.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialog({ kind: "createBranch", fromRef: null });
                }}
                aria-label={t.sidebar.createBranchTitle}
                title={t.sidebar.createBranchTitle}
                className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-accent hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            {localOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {branchTree.map((node) => renderTreeNode(node))}
              </div>
            )}
          </div>

          {/* REMOTES */}
          <div>
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setRemoteOpen(!remoteOpen)}
                aria-expanded={remoteOpen}
                aria-label={t.sidebar.remotes}
                className="flex items-center gap-1.5 flex-1 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
              >
                {remoteOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <Cloud size={13} />
                <span>
                  {t.sidebar.remotes} ({remoteBranches.length})
                </span>
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title={t.sidebar.manageRemotesTitle}
                  aria-label={t.sidebar.manageRemotesTitle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ kind: "manageRemotes" });
                  }}
                  className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-accent hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
                >
                  <Settings2 size={13} />
                </button>
                <button
                  type="button"
                  title={t.sidebar.addRemoteTitle}
                  aria-label={t.sidebar.addRemoteTitle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ kind: "addRemote" });
                  }}
                  className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-accent hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {remoteOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {remoteBranches.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-tertiary italic">
                    {t.sidebar.emptyRemotes}
                  </div>
                ) : (
                  remoteBranchTree.map((node) => renderRemoteTreeNode(node))
                )}
              </div>
            )}
          </div>

          {/* TAGS */}
          <TagSection
            isOpen={tagsOpen}
            onToggle={() => setTagsOpen(!tagsOpen)}
            tags={filteredTags}
            totalTagCount={tagItems.length}
            headCommitId={
              branchData?.local.find((b) => b.is_head)?.target_commit_id ||
              branchData?.local[0]?.target_commit_id ||
              ""
            }
            openMenuTag={tagMenuOpenName}
            onSetMenuTag={setTagMenuOpenName}
            menuRef={activeMenuRef}
            onCheckoutTag={handleCheckoutTag}
            onPushTag={handlePushTag}
            onOpenDialog={setDialog}
          />

          {/* PULL REQUESTS */}
          <PullRequestsSection repoPath={currentRepo.path} />

          {/* STASHES */}
          <StashSection
            isOpen={stashOpen}
            onToggle={() => setStashOpen(!stashOpen)}
            stashes={stashes}
            selectedStash={selectedStash}
            onSelectStash={setSelectedStash}
            onApply={handleApplyStash}
            onPop={handlePopStash}
            onDrop={handleDropStash}
          />
        </div>
      </aside>

      {/* Stash diff panel (shown beside sidebar when stash is selected) */}
      {selectedStash && (
        <aside className="bg-surface border-r border-border-subtle w-72 shrink-0 h-full flex flex-col overflow-y-auto">
          <StashDiffView
            stashItem={selectedStash}
            repoPath={currentRepo.path}
            onApply={handleApplyStash}
            onPop={handlePopStash}
            onDrop={handleDropStash}
          />
        </aside>
      )}

      {/* MODALS — one slot, so at most one of these renders at a time. */}
      {isDialog(dialog, "createBranch") && (
        <CreateBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          targetCommit={dialog.fromRef}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "createTag") && (
        <CreateTagModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          targetCommitId={dialog.commitId}
          targetCommitSummary={dialog.summary}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "deleteTag") && (
        <DeleteTagModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          tagName={dialog.tag.name}
          targetCommitId={dialog.tag.target_commit_id}
          hasRemote={Boolean(branchData?.remote && branchData.remote.length > 0)}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "renameBranch") && (
        <RenameBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          currentName={dialog.name}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "deleteBranch") && (
        <DeleteBranchModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          branchName={dialog.name}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "checkoutConflict") && (
        <CheckoutConflictModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          targetBranch={dialog.targetBranch}
          errorMessage={dialog.errorMessage}
          onNavigateToChanges={() => setActiveScreen("changes")}
          onSuccess={invalidateRepo}
        />
      )}

      {isDialog(dialog, "merge") && (
        <MergeBranchModal
          isOpen={true}
          onClose={closeDialog}
          currentBranch={currentBranchName}
          targetBranch={dialog.targetBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onMerge={async (noFf) => {
            const res = await invokeCommand.mergeBranch(
              currentRepo.path,
              dialog.targetBranch,
              noFf
            );
            invalidateRepo();
            return res;
          }}
        />
      )}

      {isDialog(dialog, "rebase") && (
        <RebaseBranchModal
          isOpen={true}
          onClose={closeDialog}
          currentBranch={currentBranchName}
          upstreamBranch={dialog.upstreamBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onRebase={async () => {
            const res = await invokeCommand.rebaseBranch(currentRepo.path, dialog.upstreamBranch);
            invalidateRepo();
            return res;
          }}
        />
      )}

      {isDialog(dialog, "compare") && (
        <CompareModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          initialBaseRev={dialog.baseRev}
          initialTargetRev={dialog.targetRev}
          branches={branchData?.local}
          tags={tagItems}
        />
      )}

      {isDialog(dialog, "manageRemotes") && (
        <ManageRemotesModal isOpen onClose={closeDialog} repoPath={currentRepo.path} />
      )}

      {(isDialog(dialog, "addRemote") || isDialog(dialog, "editRemote")) && (
        <AddEditRemoteModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          initialRemote={isDialog(dialog, "editRemote") ? dialog.remote : null}
          onSuccess={invalidateRemotes}
        />
      )}

      {isDialog(dialog, "pruneRemote") && (
        <PruneConfirmModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          remoteName={dialog.remoteName}
          onSuccess={invalidateRemotes}
        />
      )}

      {isDialog(dialog, "deleteRemote") && (
        <DeleteRemoteModal
          isOpen
          onClose={closeDialog}
          repoPath={currentRepo.path}
          remote={dialog.remote}
          onSuccess={invalidateRemotes}
        />
      )}
    </>
  );
};
