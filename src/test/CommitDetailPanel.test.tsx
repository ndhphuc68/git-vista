import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommitDetailPanel } from "../features/history";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLayoutStore } from "../store/useLayoutStore";
import { useInspectorStore } from "../store/useInspectorStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { getTranslation } from "../i18n";
import { invokeCommand } from "../ipc/client";
import { qk } from "../domain/queryKeys";

const details = {
  id: "commit-123456789",
  full_message: "feat(history): Show details\n\nExplain the change",
  author_name: "Ada Lovelace",
  author_email: "ada@example.com",
  author_timestamp_sec: 1700000000,
  parent_ids: ["parent-1"],
  files: [
    { path: "src/alpha.ts", status: "M", additions: 10, deletions: 2 },
    { path: "README.md", status: "R100", additions: 3, deletions: 0 },
  ],
  total_additions: 13,
  total_deletions: 2,
};
const t = getTranslation("en");
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useSettingsStore.setState({ locale: "en" });
  useRepoStore
    .getState()
    .setRepo({
      path: "/test/repo",
      name: "Test repo",
      is_bare: false,
      head_branch: "main",
      head_commit_id: details.id,
    });
  useRepoStore.getState().setSelectedCommit(details.id);
  useInspectorStore.getState().closeInspector();
  useLayoutStore.getState().setDetailPanelOpen(true);
  localStorage.removeItem("git-vista:commit-detail-files-width");
  vi.spyOn(invokeCommand, "getCommitDetails").mockResolvedValue(details);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderPanel(onClose?: () => void) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CommitDetailPanel onClose={onClose} />
    </QueryClientProvider>
  );
}

describe("CommitDetailPanel", () => {
  it("loads metadata and the first diff, then navigates with disabled boundaries", async () => {
    const diffQuery = vi.spyOn(invokeCommand, "getCommitFileDiff");
    renderPanel();
    expect(await screen.findByText("Show details")).toBeInTheDocument();
    expect(screen.getByText("Explain the change")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.getAllByText("+10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-2").length).toBeGreaterThan(0);
    expect(invokeCommand.getCommitDetails).toHaveBeenCalledWith("/test/repo", details.id);
    expect(queryClient.getQueryData(qk.commitDetails("/test/repo", details.id))).toEqual(details);
    expect(diffQuery).toHaveBeenCalledWith(
      "/test/repo",
      details.id,
      "src/alpha.ts",
      expect.any(Boolean)
    );
    expect(screen.getByTitle(t.diff.prevFile)).toBeDisabled();
    fireEvent.click(screen.getByTitle(t.diff.nextFile));
    expect(useRepoStore.getState().selectedFilePath).toBe("README.md");
    expect(screen.getByTitle(t.diff.nextFile)).toBeDisabled();
    expect(screen.getAllByText(t.diff.fileStatus.renamed).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTitle(t.diff.prevFile));
    expect(useRepoStore.getState().selectedFilePath).toBe("src/alpha.ts");
  });

  it("does not load details without a repository or selected commit", () => {
    useRepoStore.setState({ currentRepo: null, selectedCommitId: null });
    renderPanel();
    expect(screen.getByText(t.diff.selectCommitPrompt)).toBeInTheDocument();
    act(() => useRepoStore.setState({ selectedCommitId: details.id }));
    expect(invokeCommand.getCommitDetails).not.toHaveBeenCalled();
  });

  it("filters the list while preserving the active diff until a file is selected", async () => {
    renderPanel();
    await screen.findByText("README.md");
    fireEvent.change(screen.getByPlaceholderText(t.diff.searchFilesPlaceholder), {
      target: { value: "readme" },
    });
    expect(screen.queryByText("alpha.ts")).not.toBeInTheDocument();
    expect(useRepoStore.getState().selectedFilePath).toBe("src/alpha.ts");
    fireEvent.click(screen.getByTitle("README.md"));
    expect(useRepoStore.getState().selectedFilePath).toBe("README.md");
    fireEvent.change(screen.getByPlaceholderText(t.diff.searchFilesPlaceholder), {
      target: { value: "missing" },
    });
    expect(screen.getByText(t.diff.noMatchingFiles)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(t.diff.clearFilterTitle));
    expect(screen.getByText("alpha.ts")).toBeInTheDocument();
  });

  it("opens blame at the commit and history without a commit", async () => {
    renderPanel();
    await screen.findByText("README.md");
    fireEvent.click(screen.getAllByTitle(t.inspector.viewBlame)[0]!);
    expect(useInspectorStore.getState()).toMatchObject({
      isOpen: true,
      activeTab: "blame",
      filePath: "src/alpha.ts",
      commitId: details.id,
    });
    fireEvent.click(screen.getAllByTitle(t.inspector.viewHistory).at(-1)!);
    expect(useInspectorStore.getState()).toMatchObject({
      isOpen: true,
      activeTab: "history",
      filePath: "src/alpha.ts",
      commitId: null,
    });
  });

  it("closes with Escape through the callback or the layout and repository stores", () => {
    const onClose = vi.fn();
    const { unmount } = renderPanel(onClose);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(useRepoStore.getState().selectedCommitId).toBe(details.id);
    unmount();
    renderPanel();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useLayoutStore.getState().detailPanelOpen).toBe(false);
    expect(useRepoStore.getState().selectedCommitId).toBeNull();
  });

  it("copies full SHA and path with temporary check feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderPanel();
    await screen.findByText("README.md");
    vi.useFakeTimers();
    const shaButton = screen.getByTitle(t.diff.copyShaTooltip);
    const pathButton = screen.getByTitle(t.diff.copyPathTooltip);
    fireEvent.click(shaButton);
    fireEvent.click(pathButton);
    expect(writeText.mock.calls).toEqual([[details.id], ["src/alpha.ts"]]);
    expect(shaButton.querySelector(".lucide-check")).toBeInTheDocument();
    expect(pathButton.querySelector(".lucide-check")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(shaButton.querySelector(".lucide-copy")).toBeInTheDocument();
    expect(pathButton.querySelector(".lucide-copy")).toBeInTheDocument();
  });

  it("restores, clamps, and persists file pane width and resets on double click", async () => {
    localStorage.setItem("git-vista:commit-detail-files-width", "410");
    renderPanel();
    await screen.findByText("README.md");
    const resizer = screen.getByTitle(t.diff.resizerTooltip);
    const pane = resizer.previousElementSibling as HTMLElement;
    expect(pane.style.width).toBe("410px");
    fireEvent.mouseDown(resizer, { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 1000 });
    expect(pane.style.width).toBe("600px");
    expect(localStorage.getItem("git-vista:commit-detail-files-width")).toBe("600");
    fireEvent.mouseMove(window, { clientX: -1000 });
    expect(pane.style.width).toBe("260px");
    fireEvent.mouseUp(window);
    fireEvent.doubleClick(resizer);
    expect(pane.style.width).toBe("340px");
    expect(document.body.style.cursor).toBe("");
  });
});
