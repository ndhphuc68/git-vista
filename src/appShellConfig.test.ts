import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildGlobalShortcutsConfig, buildCommandContext } from "./appShellConfig";
import { usePullRequestStore } from "./store/usePullRequestStore";
import { type RepoSummary } from "./ipc/bindings.generated";

const repo: RepoSummary = {
  path: "/repo",
  name: "repo",
  is_bare: false,
  head_branch: "main",
  head_commit_id: "abc1234",
};

function baseShortcutsDeps() {
  return {
    repoToDisplay: repo as RepoSummary | null,
    setIsGlobalCreateBranchOpen: vi.fn(),
    openCommandPalette: vi.fn(),
    setIsShortcutsHelpOpen: vi.fn(),
    handleToggleTheme: vi.fn(),
    openSettings: vi.fn(),
    handleBackToWelcome: vi.fn(),
    activeTabId: "d:/repo",
    closeTab: vi.fn(),
    handleNextTab: vi.fn(),
    handlePrevTab: vi.fn(),
    setIsGlobalManageRemotesOpen: vi.fn(),
    setIsGlobalInteractiveRebaseOpen: vi.fn(),
    setIsGlobalCompareOpen: vi.fn(),
    closeSettings: vi.fn(),
    closeCommandPalette: vi.fn(),
  };
}

describe("buildGlobalShortcutsConfig", () => {
  it("opens the create-branch dialog only when a repo is displayed", () => {
    const deps = baseShortcutsDeps();
    const config = buildGlobalShortcutsConfig({ ...deps, repoToDisplay: null });
    config.onOpenCreateBranch?.();
    expect(deps.setIsGlobalCreateBranchOpen).not.toHaveBeenCalled();

    const config2 = buildGlobalShortcutsConfig(deps);
    config2.onOpenCreateBranch?.();
    expect(deps.setIsGlobalCreateBranchOpen).toHaveBeenCalledWith(true);
  });

  it("closes the active tab only when it isn't the home tab", () => {
    const deps = baseShortcutsDeps();
    const homeConfig = buildGlobalShortcutsConfig({ ...deps, activeTabId: "home" });
    homeConfig.onCloseTab?.();
    expect(deps.closeTab).not.toHaveBeenCalled();

    const repoConfig = buildGlobalShortcutsConfig(deps);
    repoConfig.onCloseTab?.();
    expect(deps.closeTab).toHaveBeenCalledWith("d:/repo");
  });

  it("closes every global dialog and store panel on Escape", () => {
    const deps = baseShortcutsDeps();
    usePullRequestStore.getState().openCreateModal();
    const config = buildGlobalShortcutsConfig(deps);

    config.onEscape?.();

    expect(deps.setIsGlobalCreateBranchOpen).toHaveBeenCalledWith(false);
    expect(deps.setIsGlobalManageRemotesOpen).toHaveBeenCalledWith(false);
    expect(deps.setIsGlobalInteractiveRebaseOpen).toHaveBeenCalledWith(false);
    expect(deps.setIsGlobalCompareOpen).toHaveBeenCalledWith(false);
    expect(deps.setIsShortcutsHelpOpen).toHaveBeenCalledWith(false);
    expect(deps.closeSettings).toHaveBeenCalled();
    expect(deps.closeCommandPalette).toHaveBeenCalled();
    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(false);
  });
});

function baseCommandContextDeps() {
  return {
    repoToDisplay: repo as RepoSummary | null,
    setActiveScreen: vi.fn(),
    setIsGlobalCreateBranchOpen: vi.fn(),
    setIsGlobalManageRemotesOpen: vi.fn(),
    setIsGlobalInteractiveRebaseOpen: vi.fn(),
    setCompareBaseRev: vi.fn(),
    setCompareTargetRev: vi.fn(),
    setIsGlobalCompareOpen: vi.fn(),
    setIsShortcutsHelpOpen: vi.fn(),
    handleToggleTheme: vi.fn(),
    openSettings: vi.fn(),
  };
}

describe("buildCommandContext", () => {
  beforeEach(() => {
    usePullRequestStore.getState().closeCreateModal();
  });

  it("exposes the current repo's path, or undefined when none is displayed", () => {
    const deps = baseCommandContextDeps();
    expect(buildCommandContext(deps).repoPath).toBe("/repo");
    expect(buildCommandContext({ ...deps, repoToDisplay: null }).repoPath).toBeUndefined();
  });

  it("only opens repo-scoped commands when a repo is displayed", () => {
    const deps = baseCommandContextDeps();
    const noRepoContext = buildCommandContext({ ...deps, repoToDisplay: null });
    noRepoContext.openCreateBranch?.();
    noRepoContext.openManageRemotes?.();
    noRepoContext.openInteractiveRebase?.();
    noRepoContext.openCompare?.();
    noRepoContext.openCreatePullRequest?.();
    noRepoContext.openPullRequests?.();
    expect(deps.setIsGlobalCreateBranchOpen).not.toHaveBeenCalled();
    expect(deps.setIsGlobalManageRemotesOpen).not.toHaveBeenCalled();
    expect(deps.setIsGlobalInteractiveRebaseOpen).not.toHaveBeenCalled();
    expect(deps.setIsGlobalCompareOpen).not.toHaveBeenCalled();
    expect(deps.setActiveScreen).not.toHaveBeenCalled();
    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(false);

    const context = buildCommandContext(deps);
    context.openCreateBranch?.();
    expect(deps.setIsGlobalCreateBranchOpen).toHaveBeenCalledWith(true);
    context.openManageRemotes?.();
    expect(deps.setIsGlobalManageRemotesOpen).toHaveBeenCalledWith(true);
    context.openInteractiveRebase?.();
    expect(deps.setIsGlobalInteractiveRebaseOpen).toHaveBeenCalledWith(true);
    context.openCreatePullRequest?.();
    expect(usePullRequestStore.getState().isCreateModalOpen).toBe(true);
    context.openPullRequests?.();
    expect(deps.setActiveScreen).toHaveBeenCalledWith("history");
  });

  it("seeds the compare dialog from the repo's head branch against HEAD", () => {
    const deps = baseCommandContextDeps();
    const context = buildCommandContext(deps);

    context.openCompare?.();

    expect(deps.setCompareBaseRev).toHaveBeenCalledWith("main");
    expect(deps.setCompareTargetRev).toHaveBeenCalledWith("HEAD");
    expect(deps.setIsGlobalCompareOpen).toHaveBeenCalledWith(true);
  });

  it("falls back to main when the repo has no head branch", () => {
    const deps = baseCommandContextDeps();
    const context = buildCommandContext({
      ...deps,
      repoToDisplay: { ...repo, head_branch: "" },
    });

    context.openCompare?.();

    expect(deps.setCompareBaseRev).toHaveBeenCalledWith("main");
  });

  it("wires theme toggle and settings straight through", () => {
    const deps = baseCommandContextDeps();
    const context = buildCommandContext(deps);

    context.toggleTheme?.();
    context.openSettings?.();
    context.openShortcutsHelp?.();

    expect(deps.handleToggleTheme).toHaveBeenCalled();
    expect(deps.openSettings).toHaveBeenCalledWith();
    expect(deps.setIsShortcutsHelpOpen).toHaveBeenCalledWith(true);
  });
});
