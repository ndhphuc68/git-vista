import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RepoHeaderGitActions } from "./RepoHeaderGitActions";
import { invokeCommand } from "../../ipc/client";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { vi as viTranslations } from "../../i18n/vi";
import { type useRemoteTask } from "../../features/remote/api";

const remote = {
  task: null,
  isPending: false,
  run: vi.fn(),
} as unknown as ReturnType<typeof useRemoteTask>;

function renderActions(options: { repoPath?: string } = { repoPath: "D:/repos/demo" }) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RepoHeaderGitActions
        t={viTranslations}
        actions={viTranslations.gitActions.advanced}
        repoPath={options.repoPath}
        remote={remote}
        aheadCount={0}
        behindCount={0}
        hasUpstream
        onOpenSettings={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe("RepoHeaderGitActions - open in editor", () => {
  beforeEach(() => {
    useSettingsStore.getState().setDefaultEditor("code");
    useSettingsStore.getState().setCustomEditorCommand("");
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the repo with the editor chosen in settings", async () => {
    const spy = vi.spyOn(invokeCommand, "openInEditor").mockResolvedValue(undefined);
    useSettingsStore.getState().setDefaultEditor("cursor");
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-editor"));

    await waitFor(() => expect(spy).toHaveBeenCalledWith("D:/repos/demo", "cursor", null));
  });

  it("passes the custom command only for the custom editor", async () => {
    const spy = vi.spyOn(invokeCommand, "openInEditor").mockResolvedValue(undefined);
    useSettingsStore.getState().setDefaultEditor("custom");
    useSettingsStore.getState().setCustomEditorCommand("nvim-qt");
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-editor"));

    await waitFor(() => expect(spy).toHaveBeenCalledWith("D:/repos/demo", "custom", "nvim-qt"));
  });

  it("shows a not-found toast when the editor is missing from PATH", async () => {
    vi.spyOn(invokeCommand, "openInEditor").mockRejectedValue({
      type: "NotFound",
      message: "code.cmd",
    });
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-editor"));

    await waitFor(() => {
      const [toast] = useToastStore.getState().toasts;
      expect(toast?.type).toBe("error");
      expect(JSON.stringify(toast)).toContain(
        viTranslations.header.editorNotFound.replace("{program}", "code.cmd")
      );
    });
  });

  it("disables the button when no repo is open", () => {
    renderActions({});
    expect(screen.getByTestId("btn-open-in-editor")).toBeDisabled();
  });
});

describe("RepoHeaderGitActions - open in terminal", () => {
  beforeEach(() => {
    useSettingsStore.getState().setDefaultTerminal("powershell");
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the repo in the terminal chosen in settings", async () => {
    const spy = vi.spyOn(invokeCommand, "openInTerminal").mockResolvedValue(undefined);
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-terminal"));

    await waitFor(() => expect(spy).toHaveBeenCalledWith("D:/repos/demo", "powershell"));
  });

  it("shows a toast when the terminal is not installed", async () => {
    vi.spyOn(invokeCommand, "openInTerminal").mockRejectedValue({
      type: "NotFound",
      message: "git-bash.exe",
    });
    renderActions();

    fireEvent.click(screen.getByTestId("btn-open-in-terminal"));

    await waitFor(() => {
      const [toast] = useToastStore.getState().toasts;
      expect(toast?.type).toBe("error");
      expect(JSON.stringify(toast)).toContain(
        viTranslations.header.editorNotFound.replace("{program}", "git-bash.exe")
      );
    });
  });

  it("disables the button when no repo is open", () => {
    renderActions({});
    expect(screen.getByTestId("btn-open-in-terminal")).toBeDisabled();
  });
});
