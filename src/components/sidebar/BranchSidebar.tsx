import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import {
  GitBranch,
  Globe,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  Check,
  Edit3,
  Trash2,
  Archive,
  Play,
  PlayCircle,
  GitMerge,
  GitCommit,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { invokeCommand } from "../../ipc/client";
import { StashItem } from "../../ipc/bindings";
import { useToastStore } from "../../store/useToastStore";
import { mapGitError } from "../../utils/errorMapping";
import { CreateBranchModal } from "./CreateBranchModal";
import { RenameBranchModal } from "./RenameBranchModal";
import { DeleteBranchModal } from "./DeleteBranchModal";
import { CheckoutConflictModal } from "./CheckoutConflictModal";
import { StashDiffView } from "../stash/StashDiffView";
import { MergeBranchModal } from "../merge/MergeBranchModal";
import { RebaseBranchModal } from "../merge/RebaseBranchModal";

export const BranchSidebar: React.FC = () => {
  const { currentRepo, selectedBranch, setSelectedBranch } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [localOpen, setLocalOpen] = useState(true);
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [stashOpen, setStashOpen] = useState(false);
  const [selectedStash, setSelectedStash] = useState<StashItem | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renameBranchName, setRenameBranchName] = useState<string | null>(null);
  const [deleteBranchInfo, setDeleteBranchInfo] = useState<{
    name: string;
    commitId: string;
  } | null>(null);
  const [mergeModal, setMergeModal] = useState<{ targetBranch: string } | null>(null);
  const [rebaseModal, setRebaseModal] = useState<{ upstreamBranch: string } | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{
    targetBranch: string;
    errorMessage: string;
  } | null>(null);

  // Context / Action menu state
  const [menuBranch, setMenuBranch] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuBranch(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const { data: branchData } = useQuery({
    queryKey: ["branches", currentRepo?.path],
    queryFn: () => invokeCommand.getBranches(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  const { data: repoStatus } = useQuery({
    queryKey: ["repo_status", currentRepo?.path],
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
    queryKey: ["stashes", currentRepo?.path],
    queryFn: () => invokeCommand.getStashes(currentRepo!.path),
    enabled: !!currentRepo?.path,
  });

  if (!currentRepo) return null;

  const invalidateRepo = () => {
    queryClient.invalidateQueries({ queryKey: ["branches", currentRepo.path] });
    queryClient.invalidateQueries({ queryKey: ["commit_graph", currentRepo.path] });
    queryClient.invalidateQueries({ queryKey: ["repo_status", currentRepo.path] });
    queryClient.invalidateQueries({ queryKey: ["repo_head_info", currentRepo.path] });
  };

  const handleCheckout = async (branchName: string) => {
    setMenuBranch(null);
    try {
      await invokeCommand.checkoutBranch(currentRepo.path, branchName);
      setSelectedBranch(branchName);
      invalidateRepo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("CHECKOUT_CONFLICT") || msg.toLowerCase().includes("conflict")) {
        setConflictInfo({
          targetBranch: branchName,
          errorMessage: msg,
        });
      } else {
        alert(`Không thể chuyển nhánh: ${msg}`);
      }
    }
  };

  const invalidateStashes = () => {
    queryClient.invalidateQueries({ queryKey: ["stashes", currentRepo.path] });
  };

  const handleApplyStash = async (index: number) => {
    try {
      await invokeCommand.applyStash(currentRepo.path, index);
      invalidateStashes();
      queryClient.invalidateQueries({ queryKey: ["repoStatus", currentRepo.path] });
    } catch (err: unknown) {
      alert(`Khong the ap dung stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePopStash = async (index: number) => {
    try {
      await invokeCommand.popStash(currentRepo.path, index);
      invalidateStashes();
      queryClient.invalidateQueries({ queryKey: ["repoStatus", currentRepo.path] });
      setSelectedStash(null);
    } catch (err: unknown) {
      alert(`Khong the pop stash: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDropStash = async (index: number) => {
    if (!window.confirm("Xoa stash nay?")) return;
    const stashToDrop = stashes[index];
    try {
      await invokeCommand.dropStash(currentRepo.path, index);
      invalidateStashes();
      setSelectedStash(null);
      if (stashToDrop) {
        useToastStore.getState().showToast({
          message: `Đã xoá stash@{${index}}`,
          type: "success",
          durationMs: 10000,
          undoAction: async () => {
            await invokeCommand.undoDropStash(
              currentRepo.path,
              stashToDrop.commit_id,
              stashToDrop.message
            );
            invalidateStashes();
          },
        });
      }
    } catch (err: unknown) {
      useToastStore.getState().showError(mapGitError(err));
    }
  };

  const localBranches = (branchData?.local || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const remoteBranches = (branchData?.remote || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const tags = (branchData?.tags || []).filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <aside className="bg-surface border-r border-border-subtle w-60 shrink-0 h-full flex flex-col overflow-y-auto">
        <div className="px-3 py-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 bg-window rounded-sm px-2 py-1 border border-border-subtle">
            <Search size={12} className="text-tertiary shrink-0" />
            <input
              type="text"
              placeholder="Tìm nhánh..."
              aria-label="Tìm nhánh"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs text-primary w-full"
            />
          </div>
        </div>

        <div className="p-2 flex flex-col gap-3">
          {/* LOCAL BRANCHES */}
          <div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLocalOpen(!localOpen)}
                aria-expanded={localOpen}
                aria-label="Nhánh cục bộ"
                className="flex items-center gap-1 p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
              >
                {localOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <GitBranch size={13} />
                <span>NHÁNH CỤC BỘ ({localBranches.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                aria-label="Tạo nhánh mới"
                title="Tạo nhánh mới (Ctrl+B)"
                className="flex items-center justify-center p-1 bg-transparent border-0 text-secondary hover:text-accent hover:bg-surface-hover rounded-sm cursor-pointer transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            {localOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {localBranches.map((branch) => {
                  const isSelected = selectedBranch === branch.name;
                  const isMenuOpen = menuBranch === branch.name;

                  return (
                    <div
                      key={branch.name}
                      className="group relative flex items-center justify-between rounded-sm"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuBranch(branch.name);
                      }}
                    >
                      <button
                        onClick={() => setSelectedBranch(branch.name)}
                        onDoubleClick={() => {
                          if (!branch.is_head) handleCheckout(branch.name);
                        }}
                        aria-selected={isSelected}
                        className={clsx(
                          "flex-1 flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs transition-colors overflow-hidden",
                          isSelected
                            ? "bg-accent-subtle text-accent font-semibold"
                            : "bg-transparent text-primary hover:bg-surface-hover font-normal",
                          branch.is_head && "font-semibold"
                        )}
                        title={
                          branch.is_head
                            ? `${branch.name} (HEAD)`
                            : `Nhấn đúp để chuyển sang nhánh ${branch.name}`
                        }
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            branch.is_head
                              ? "bg-accent"
                              : "border border-tertiary bg-transparent"
                          )}
                        />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {branch.name}
                        </span>
                        {branch.is_head && (
                          <span className="text-[10px] text-accent ml-auto shrink-0 px-1 py-0.2 bg-accent/10 rounded-xs font-semibold">
                            HEAD
                          </span>
                        )}
                      </button>

                      {/* Three dots menu button */}
                      <div className="relative shrink-0 flex items-center pr-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuBranch(isMenuOpen ? null : branch.name);
                          }}
                          aria-label={`Menu thao tác nhánh ${branch.name}`}
                          className={clsx(
                            "p-1 bg-transparent border-0 text-secondary hover:text-primary hover:bg-surface-hover rounded-sm cursor-pointer transition-opacity",
                            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                          )}
                        >
                          <MoreVertical size={13} />
                        </button>

                        {/* Dropdown Action Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border-subtle rounded-md shadow-xl py-1 z-50 text-xs flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!branch.is_head && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCheckout(branch.name)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                                >
                                  <Check size={13} className="text-accent" />
                                  <span>Chuyển tới nhánh này</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuBranch(null);
                                    setMergeModal({ targetBranch: branch.name });
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                                >
                                  <GitMerge size={13} className="text-secondary" />
                                  <span>Gộp vào nhánh hiện tại...</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuBranch(null);
                                    setRebaseModal({ upstreamBranch: branch.name });
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                                >
                                  <GitCommit size={13} className="text-secondary" />
                                  <span>Rebase nhánh hiện tại lên đây...</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMenuBranch(null);
                                setRenameBranchName(branch.name);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-primary hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
                            >
                              <Edit3 size={13} className="text-secondary" />
                              <span>Đổi tên...</span>
                            </button>

                            {!branch.is_head && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuBranch(null);
                                  setDeleteBranchInfo({
                                    name: branch.name,
                                    commitId: branch.target_commit_id,
                                  });
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-transparent border-0 text-diff-remove-text hover:bg-diff-remove-bg cursor-pointer text-left w-full transition-colors"
                              >
                                <Trash2 size={13} />
                                <span>Xoá nhánh...</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REMOTE BRANCHES */}
          <div>
            <button
              onClick={() => setRemoteOpen(!remoteOpen)}
              aria-expanded={remoteOpen}
              aria-label="Nhánh máy chủ"
              className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary font-semibold text-xs cursor-pointer"
            >
              {remoteOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <Globe size={13} />
              <span>NHÁNH MÁY CHỦ ({remoteBranches.length})</span>
            </button>

            {remoteOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {remoteBranches.map((branch) => (
                  <div
                    key={branch.name}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-secondary text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    <Globe size={11} className="text-tertiary shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {branch.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TAGS */}
          <div>
            <button
              onClick={() => setTagsOpen(!tagsOpen)}
              aria-expanded={tagsOpen}
              aria-label="Tags"
              className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary font-semibold text-xs cursor-pointer"
            >
              {tagsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <Tag size={13} />
              <span>TAGS ({tags.length})</span>
            </button>

            {tagsOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STASH */}
          <div>
            <button
              onClick={() => setStashOpen(!stashOpen)}
              aria-expanded={stashOpen}
              aria-label="Stash"
              className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary font-semibold text-xs cursor-pointer"
            >
              {stashOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <Archive size={13} />
              <span>STASH ({stashes.length})</span>
            </button>

            {stashOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {stashes.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-tertiary italic">
                    Khong co stash nao.
                  </div>
                ) : (
                  stashes.map((item) => (
                    <div
                      key={item.index}
                      className={clsx(
                        "group flex items-center justify-between rounded-sm px-2 py-1 cursor-pointer text-xs transition-colors",
                        selectedStash?.index === item.index
                          ? "bg-accent-subtle text-accent font-semibold"
                          : "bg-transparent text-primary hover:bg-surface-hover"
                      )}
                      onClick={() => setSelectedStash(item)}
                    >
                      <span className="truncate">
                        stash@{"{"}
                        {item.index}
                        {"}"}: {item.message.substring(0, 40)}
                      </span>
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Ap dung (Apply)"
                          onClick={() => handleApplyStash(item.index)}
                          className="p-0.5 bg-transparent border-0 text-secondary hover:text-accent cursor-pointer rounded-sm"
                        >
                          <Play size={11} />
                        </button>
                        <button
                          type="button"
                          title="Ap dung & Xoa (Pop)"
                          onClick={() => handlePopStash(item.index)}
                          className="p-0.5 bg-transparent border-0 text-secondary hover:text-accent cursor-pointer rounded-sm"
                        >
                          <PlayCircle size={11} />
                        </button>
                        <button
                          type="button"
                          title="Xoa Stash (Drop)"
                          onClick={() => handleDropStash(item.index)}
                          className="p-0.5 bg-transparent border-0 text-secondary hover:text-diff-remove-text cursor-pointer rounded-sm"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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

      {/* MODALS */}
      <CreateBranchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        repoPath={currentRepo.path}
        onSuccess={invalidateRepo}
      />

      <RenameBranchModal
        isOpen={Boolean(renameBranchName)}
        onClose={() => setRenameBranchName(null)}
        repoPath={currentRepo.path}
        currentName={renameBranchName || ""}
        onSuccess={invalidateRepo}
      />

      <DeleteBranchModal
        isOpen={Boolean(deleteBranchInfo)}
        onClose={() => setDeleteBranchInfo(null)}
        repoPath={currentRepo.path}
        branchName={deleteBranchInfo?.name || ""}
        targetCommitId={deleteBranchInfo?.commitId}
        onSuccess={invalidateRepo}
      />

      <CheckoutConflictModal
        isOpen={Boolean(conflictInfo)}
        onClose={() => setConflictInfo(null)}
        repoPath={currentRepo.path}
        targetBranch={conflictInfo?.targetBranch || ""}
        errorMessage={conflictInfo?.errorMessage || ""}
        onNavigateToChanges={() => setActiveScreen("changes")}
        onSuccess={invalidateRepo}
      />

      {mergeModal && (
        <MergeBranchModal
          isOpen={true}
          onClose={() => setMergeModal(null)}
          currentBranch={currentBranchName}
          targetBranch={mergeModal.targetBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onMerge={async (noFf) => {
            const res = await invokeCommand.mergeBranch(
              currentRepo.path,
              mergeModal.targetBranch,
              noFf
            );
            invalidateRepo();
            return res;
          }}
        />
      )}

      {rebaseModal && (
        <RebaseBranchModal
          isOpen={true}
          onClose={() => setRebaseModal(null)}
          currentBranch={currentBranchName}
          upstreamBranch={rebaseModal.upstreamBranch}
          hasUncommittedChanges={hasUncommittedChanges}
          onRebase={async () => {
            const res = await invokeCommand.rebaseBranch(
              currentRepo.path,
              rebaseModal.upstreamBranch
            );
            invalidateRepo();
            return res;
          }}
        />
      )}
    </>
  );
};
