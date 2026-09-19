import { describe, it, expect, beforeEach } from "vitest";
import { useTabStore } from "../store/useTabStore";
import { type RepoSummary } from "../ipc/bindings.generated";

const mockRepo1: RepoSummary = {
  path: "d:/projects/repo1",
  name: "repo1",
  is_bare: false,
  head_branch: "main",
  head_commit_id: "c111",
};

const mockRepo2: RepoSummary = {
  path: "d:/projects/repo2",
  name: "repo2",
  is_bare: false,
  head_branch: "develop",
  head_commit_id: "c222",
};

describe("useTabStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useTabStore.getState().reset();
  });

  it("initializes with Home tab as active", () => {
    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]?.id).toBe("home");
    expect(state.tabs[0]?.type).toBe("home");
    expect(state.activeTabId).toBe("home");
  });

  it("opens a repo tab and switches active tab", () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);

    const updated = useTabStore.getState();
    expect(updated.tabs).toHaveLength(2);
    expect(updated.tabs[1]?.id).toBe(mockRepo1.path);
    expect(updated.tabs[1]?.type).toBe("repo");
    expect(updated.tabs[1]?.repo?.name).toBe("repo1");
    expect(updated.tabs[1]?.selectedBranch).toBe("main");
    expect(updated.activeTabId).toBe(mockRepo1.path);
  });

  it("does not duplicate tabs when opening the same repo again", () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);
    store.openHomeTab();
    expect(useTabStore.getState().activeTabId).toBe("home");

    store.openRepoTab(mockRepo1);
    const updated = useTabStore.getState();
    expect(updated.tabs).toHaveLength(2);
    expect(updated.activeTabId).toBe(mockRepo1.path);
  });

  it("switches active tab cleanly between multiple repo tabs", () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);
    store.openRepoTab(mockRepo2);

    expect(useTabStore.getState().tabs).toHaveLength(3);
    expect(useTabStore.getState().activeTabId).toBe(mockRepo2.path);

    store.setActiveTab(mockRepo1.path);
    expect(useTabStore.getState().activeTabId).toBe(mockRepo1.path);
  });

  it("preserves independent tab states when updating", () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);
    store.openRepoTab(mockRepo2);

    store.updateTabState(mockRepo1.path, {
      activeScreen: "changes",
      selectedCommitId: "commit-123",
      selectedFilePath: "src/main.ts",
    });

    const repo1Tab = useTabStore.getState().tabs.find((t) => t.id === mockRepo1.path);
    const repo2Tab = useTabStore.getState().tabs.find((t) => t.id === mockRepo2.path);

    expect(repo1Tab?.activeScreen).toBe("changes");
    expect(repo1Tab?.selectedCommitId).toBe("commit-123");
    expect(repo1Tab?.selectedFilePath).toBe("src/main.ts");

    expect(repo2Tab?.activeScreen).toBe("history");
    expect(repo2Tab?.selectedCommitId).toBeNull();
  });

  it("closes a repo tab and automatically focuses neighbor tab or home", () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);
    store.openRepoTab(mockRepo2);
    expect(useTabStore.getState().activeTabId).toBe(mockRepo2.path);

    // Close active tab mockRepo2 -> should focus mockRepo1
    store.closeTab(mockRepo2.path);
    expect(useTabStore.getState().tabs).toHaveLength(2);
    expect(useTabStore.getState().activeTabId).toBe(mockRepo1.path);

    // Close mockRepo1 -> should focus home
    store.closeTab(mockRepo1.path);
    expect(useTabStore.getState().tabs).toHaveLength(1);
    expect(useTabStore.getState().activeTabId).toBe("home");
  });

  it("does not allow closing the home tab", () => {
    const store = useTabStore.getState();
    store.closeTab("home");
    expect(useTabStore.getState().tabs).toHaveLength(1);
    expect(useTabStore.getState().activeTabId).toBe("home");
  });

  it("persists tabs in localStorage session and restores them", async () => {
    const store = useTabStore.getState();
    store.openRepoTab(mockRepo1);

    const raw = localStorage.getItem("gitvista_session_tabs_v1");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.openRepoPaths).toContain(mockRepo1.path);
    expect(parsed.activeTabId).toBe(mockRepo1.path);
  });
});
