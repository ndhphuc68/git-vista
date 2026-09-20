import React, { useMemo } from "react";
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
import { useTranslation } from "../../../i18n";
import { buildBranchTree, type BranchTreeNode } from "../model/branchTree";
import type { SidebarDialog } from "../model/sidebarDialog";
import type { StashItem } from "../../../ipc/bindings.generated";
import type { useSidebarData } from "../hooks/useSidebarData";
import type { useSidebarActions } from "../hooks/useSidebarActions";
import { BranchTreeNode as BranchTreeNodeView } from "./BranchTreeNode";
import { RemoteTreeNode } from "./RemoteTreeNode";
import { TagSection } from "./TagSection";
import { StashSection } from "./StashSection";
import { PullRequestsSection } from "../../../components/sidebar/PullRequestsSection";

export type ActiveSidebarMenu = { type: "branch" | "remote" | "tag"; name: string } | null;
interface BranchSidebarSectionsProps {
  repoPath: string;
  data: ReturnType<typeof useSidebarData>;
  actions: ReturnType<typeof useSidebarActions>;
  search: string;
  setSearch: (value: string) => void;
  openSections: { local: boolean; remote: boolean; tags: boolean; stash: boolean };
  toggleSection: (section: "local" | "remote" | "tags" | "stash") => void;
  selectedStash: StashItem | null;
  setSelectedStash: (stash: StashItem | null) => void;
  selectedBranch: string | null;
  setSelectedBranch: (name: string) => void;
  currentBranchName: string;
  activeMenu: ActiveSidebarMenu;
  setActiveMenu: (menu: ActiveSidebarMenu) => void;
  activeMenuRef: React.RefObject<HTMLDivElement | null>;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  handleCheckout: (name: string) => Promise<void>;
  setDialog: (dialog: SidebarDialog) => void;
}

/** Section markup and display derivations; the sidebar retains UI state. */
export function BranchSidebarSections({
  repoPath,
  data,
  actions,
  search,
  setSearch,
  openSections,
  toggleSection,
  selectedStash,
  setSelectedStash,
  selectedBranch,
  setSelectedBranch,
  currentBranchName,
  activeMenu,
  setActiveMenu,
  activeMenuRef,
  expandedFolders,
  toggleFolder,
  handleCheckout,
  setDialog,
}: BranchSidebarSectionsProps) {
  const { t } = useTranslation();
  const { branchData, remotesList, stashes, tagItems } = data;
  const { local: localOpen, remote: remoteOpen, tags: tagsOpen, stash: stashOpen } = openSections;
  const {
    applyStash: handleApplyStash,
    popStash: handlePopStash,
    dropStash: handleDropStash,
    checkoutTag: handleCheckoutTag,
    pushTag: handlePushTag,
  } = actions;
  const menuBranch = activeMenu?.type === "branch" ? activeMenu.name : null;
  const remoteMenuName = activeMenu?.type === "remote" ? activeMenu.name : null;
  const tagMenuOpenName = activeMenu?.type === "tag" ? activeMenu.name : null;
  const setMenuBranch = (name: string | null) =>
    setActiveMenu(name ? { type: "branch", name } : null);
  const setRemoteMenuName = (name: string | null) =>
    setActiveMenu(name ? { type: "remote", name } : null);
  const setTagMenuOpenName = (name: string | null) =>
    setActiveMenu(name ? { type: "tag", name } : null);
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
              onClick={() => toggleSection("local")}
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
              onClick={() => toggleSection("remote")}
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
          onToggle={() => toggleSection("tags")}
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
        <PullRequestsSection repoPath={repoPath} />

        {/* STASHES */}
        <StashSection
          isOpen={stashOpen}
          onToggle={() => toggleSection("stash")}
          stashes={stashes}
          selectedStash={selectedStash}
          onSelectStash={setSelectedStash}
          onApply={handleApplyStash}
          onPop={handlePopStash}
          onDrop={handleDropStash}
        />
      </div>
    </aside>
  );
}
