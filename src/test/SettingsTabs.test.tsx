import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DiffViewerTab } from "../components/settings/tabs/DiffViewerTab";
import { ExternalToolsTab } from "../components/settings/tabs/ExternalToolsTab";
import { AppearanceTab } from "../components/settings/tabs/AppearanceTab";
import { GitBehaviorTab } from "../components/settings/tabs/GitBehaviorTab";
import { GitProfileTab } from "../components/settings/tabs/GitProfileTab";
import { useSettingsStore } from "../store/useSettingsStore";
import { resetMockGitConfig } from "../ipc/client";

describe("Settings Tabs Components", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockGitConfig();
    const settings = useSettingsStore.getState();
    settings.setLocale("vi");
    settings.setTheme("light");
    settings.setDiffViewMode("unified");
    settings.setDiffFontSize(13);
    settings.setDiffIgnoreWhitespace(false);
    settings.setDiffTabSize(4);
    settings.setDiffShowLineNumbers(true);
    settings.setDateFormat("relative");
    settings.setAvatarStyle("initials");
    settings.setDefaultEditor("code");
    settings.setCustomEditorCommand("");
    settings.setDefaultTerminal("wt");
    settings.setConfirmDiscard(true);
    settings.setConfirmDeleteBranch(true);
    settings.setConfirmForcePush(true);
    settings.setCommitMessageLimit(50);
  });

  describe("DiffViewerTab", () => {
    it("renders diff settings and updates layout, font size, and tab size", () => {
      render(<DiffViewerTab />);

      expect(screen.getByText(/Trình xem Diff & So sánh mã/i)).toBeInTheDocument();

      // Click split view mode
      fireEvent.click(screen.getByTestId("diff-mode-split"));
      expect(useSettingsStore.getState().diffViewMode).toBe("split");

      // Click font size 16
      fireEvent.click(screen.getByTestId("diff-fontsize-16"));
      expect(useSettingsStore.getState().diffFontSize).toBe(16);

      // Click tab size 2
      fireEvent.click(screen.getByTestId("diff-tabsize-2"));
      expect(useSettingsStore.getState().diffTabSize).toBe(2);

      // Toggle whitespace
      fireEvent.click(screen.getByTestId("toggle-diff-ignore-whitespace"));
      expect(useSettingsStore.getState().diffIgnoreWhitespace).toBe(true);

      // Toggle line numbers
      fireEvent.click(screen.getByTestId("toggle-diff-show-line-numbers"));
      expect(useSettingsStore.getState().diffShowLineNumbers).toBe(false);
    });
  });

  describe("ExternalToolsTab", () => {
    it("renders external tools and allows choosing editor and terminal", () => {
      render(<ExternalToolsTab />);

      expect(screen.getByText(/Tích hợp Công cụ Ngoài/i)).toBeInTheDocument();

      // Choose Cursor
      fireEvent.click(screen.getByTestId("editor-option-cursor"));
      expect(useSettingsStore.getState().defaultEditor).toBe("cursor");

      // Choose Custom editor
      fireEvent.click(screen.getByTestId("editor-option-custom"));
      expect(useSettingsStore.getState().defaultEditor).toBe("custom");

      const customInput = screen.getByTestId("custom-editor-input");
      expect(customInput).toBeInTheDocument();
      fireEvent.change(customInput, { target: { value: "nvim" } });
      expect(useSettingsStore.getState().customEditorCommand).toBe("nvim");

      // Choose PowerShell terminal
      fireEvent.click(screen.getByTestId("terminal-option-powershell"));
      expect(useSettingsStore.getState().defaultTerminal).toBe("powershell");
    });
  });

  describe("AppearanceTab", () => {
    it("updates date format and avatar style", () => {
      render(<AppearanceTab />);

      // Update date format
      fireEvent.click(screen.getByTestId("date-format-absolute"));
      expect(useSettingsStore.getState().dateFormat).toBe("absolute");

      // Update avatar style
      fireEvent.click(screen.getByTestId("avatar-style-gravatar"));
      expect(useSettingsStore.getState().avatarStyle).toBe("gravatar");
    });
  });

  describe("GitBehaviorTab", () => {
    it("toggles safety confirmations and git flags", async () => {
      render(<GitBehaviorTab currentRepoPath={null} />);

      await waitFor(() => {
        expect(screen.getByTestId("toggle-confirm-discard")).toBeInTheDocument();
      });

      // Toggle safety checks
      fireEvent.click(screen.getByTestId("toggle-confirm-discard"));
      expect(useSettingsStore.getState().confirmDiscard).toBe(false);

      fireEvent.click(screen.getByTestId("toggle-confirm-delete-branch"));
      expect(useSettingsStore.getState().confirmDeleteBranch).toBe(false);

      fireEvent.click(screen.getByTestId("toggle-confirm-force-push"));
      expect(useSettingsStore.getState().confirmForcePush).toBe(false);

      // Toggle fetch.prune & rebase.autoStash
      const pruneToggle = screen.getByTestId("toggle-fetch-prune");
      fireEvent.click(pruneToggle);

      const autostashToggle = screen.getByTestId("toggle-rebase-autostash");
      fireEvent.click(autostashToggle);
    });
  });

  describe("GitProfileTab", () => {
    it("configures GPG signing and commit length limit", async () => {
      render(<GitProfileTab currentRepoPath={null} />);

      await waitFor(() => {
        expect(screen.getByTestId("toggle-gpg-sign")).toBeInTheDocument();
      });

      // Toggle GPG
      fireEvent.click(screen.getByTestId("toggle-gpg-sign"));

      // Set GPG Key
      const keyInput = screen.getByLabelText(/Mã khóa GPG/i);
      fireEvent.change(keyInput, { target: { value: "ABCD1234EF" } });
      expect(keyInput).toHaveValue("ABCD1234EF");

      // Select commit message limit 72
      fireEvent.click(screen.getByTestId("commit-limit-72"));
      expect(useSettingsStore.getState().commitMessageLimit).toBe(72);

      // Save
      fireEvent.click(screen.getByTestId("save-profile-btn"));
    });
  });
});
