import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { SettingsModal } from "../components/settings/SettingsModal";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTabStore } from "../store/useTabStore";
import { resetMockGitConfig } from "../ipc/client";
import { type RepoSummary } from "../ipc/bindings.generated";

const mockRepo1: RepoSummary = {
  path: "d:/project-alpha",
  name: "project-alpha",
  is_bare: false,
  head_branch: "main",
  head_commit_id: "1111111",
};

const mockRepo2: RepoSummary = {
  path: "d:/project-beta",
  name: "project-beta",
  is_bare: false,
  head_branch: "develop",
  head_commit_id: "2222222",
};

describe("SettingsModal - 2-Tier Settings Architecture", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockGitConfig();
    const settings = useSettingsStore.getState();
    settings.setLocale("vi");
    settings.setTheme("light");
    settings.setActiveTab("profile");
    settings.openSettings();
    useTabStore.getState().reset();
  });

  it("khi mở từ màn Home/Welcome (currentRepoPath là null), mở ra cài đặt chung (Global) và không có Scope Switcher hay phần setting riêng cho repo", async () => {
    render(<SettingsModal currentRepoPath={null} />);

    expect(screen.queryByTestId("scope-switcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-btn-repo")).not.toBeInTheDocument();
    expect(await screen.findByText(/Toàn hệ thống \(Global\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhánh mặc định/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cài đặt riêng cho repository/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("toggle-use-global")).not.toBeInTheDocument();
  });

  it("ngay cả khi có repo tab mở trong nền, nếu mở từ màn Welcome (currentRepoPath là null) thì vẫn chỉ mở cài đặt chung và không có phần setting riêng cho repo", async () => {
    useTabStore.getState().openRepoTab(mockRepo1);

    render(<SettingsModal currentRepoPath={null} />);

    expect(screen.queryByTestId("scope-switcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scope-btn-repo")).not.toBeInTheDocument();
    expect(await screen.findByText(/Toàn hệ thống \(Global\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhánh mặc định/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cài đặt riêng cho repository/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("toggle-use-global")).not.toBeInTheDocument();
  });

  it("khi có repo mở, cho phép chuyển đổi giữa Global và Repository scope", async () => {
    useTabStore.getState().openRepoTab(mockRepo1);

    render(<SettingsModal currentRepoPath={mockRepo1.path} />);

    const globalBtn = await screen.findByTestId("scope-btn-global");
    const repoBtn = screen.getByTestId("scope-btn-repo");

    expect(repoBtn).not.toBeDisabled();
    // Default to repo scope when currentRepoPath is provided
    expect(repoBtn).toHaveAttribute("aria-checked", "true");

    // Switch to global scope
    fireEvent.click(globalBtn);
    expect(screen.getByTestId("scope-btn-global")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("scope-btn-repo")).toHaveAttribute("aria-checked", "false");
  });

  it("limits repo scope to the open repository even when several repos are open", async () => {
    useTabStore.getState().openRepoTab(mockRepo1);
    useTabStore.getState().openRepoTab(mockRepo2);

    render(<SettingsModal currentRepoPath={mockRepo1.path} />);

    expect(await screen.findByTestId("scope-btn-repo")).toHaveTextContent("project-alpha");
    expect(screen.queryByTestId("scope-repo-select")).not.toBeInTheDocument();
    expect(screen.queryByText("project-beta")).not.toBeInTheDocument();
    expect(screen.getByTestId("scope-hint")).toHaveTextContent("project-alpha");
  });

  it("hỗ trợ toggle Kế thừa từ Global / Ghi đè cho repo này trong GitProfileTab", async () => {
    useTabStore.getState().openRepoTab(mockRepo1);

    render(<SettingsModal currentRepoPath={mockRepo1.path} />);

    // By default in mock, local config inherits from global
    await waitFor(() => {
      expect(screen.getByTestId("toggle-use-global")).toHaveAttribute("aria-checked", "true");
    });

    // Turn inheritance off to override for this repo
    fireEvent.click(screen.getByTestId("toggle-use-global"));

    const nameInput = screen.getByLabelText(/Tên tác giả/i);
    expect(nameInput).not.toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "Alpha Author" } });
    expect(nameInput).toHaveValue("Alpha Author");
  });

  it("nút Khôi phục về Global xoá ghi đè cục bộ và khôi phục kế thừa", async () => {
    useTabStore.getState().openRepoTab(mockRepo1);

    render(<SettingsModal currentRepoPath={mockRepo1.path} />);

    await waitFor(() => {
      expect(screen.getByTestId("toggle-use-global")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("toggle-use-global"));
    const nameInput = screen.getByLabelText(/Tên tác giả/i);
    fireEvent.change(nameInput, { target: { value: "Custom Name" } });

    // Save override
    fireEvent.click(screen.getByTestId("save-profile-btn"));

    // Reset to global
    await waitFor(() => {
      expect(screen.getByTestId("reset-to-global-btn")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("reset-to-global-btn"));

    // Verify it returned to inherit
    await waitFor(() => {
      expect(screen.getByTestId("toggle-use-global")).toHaveAttribute("aria-checked", "true");
    });
  });

  it("hiển thị đầy đủ 5 tab cài đặt (Profile, Appearance, Diff, Behavior, Tools) và chuyển tab thành công", async () => {
    render(<SettingsModal currentRepoPath={null} />);

    // Check all 5 tab buttons in sidebar
    expect(screen.getByRole("button", { name: /Hồ sơ Git/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Giao diện & Hiển thị/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Trình xem Diff/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hành vi Git/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Công cụ ngoài/i })).toBeInTheDocument();

    // Switch to Appearance tab
    fireEvent.click(screen.getByRole("button", { name: /Giao diện & Hiển thị/i }));
    expect(screen.getByText(/Định dạng thời gian/i)).toBeInTheDocument();
    expect(screen.getByText(/Ảnh đại diện tác giả/i)).toBeInTheDocument();

    // Switch to Diff tab
    fireEvent.click(screen.getByRole("button", { name: /Trình xem Diff/i }));
    expect(screen.getByText(/Bố cục hiển thị Diff mặc định/i)).toBeInTheDocument();
    expect(screen.getByText(/Cỡ chữ hiển thị mã nguồn/i)).toBeInTheDocument();

    // Switch to Behavior tab
    fireEvent.click(screen.getByRole("button", { name: /Hành vi Git/i }));
    expect(screen.getByText(/Hành vi khi Kéo về/i)).toBeInTheDocument();
    expect(screen.getByText(/Hộp thoại cảnh báo & Xác nhận an toàn/i)).toBeInTheDocument();

    // Switch to Tools tab
    fireEvent.click(screen.getByRole("button", { name: /Công cụ ngoài/i }));
    expect(screen.getByText(/Trình soạn thảo mã \/ IDE mặc định/i)).toBeInTheDocument();
    expect(screen.getByText(/Cửa sổ dòng lệnh \(Terminal\) mặc định/i)).toBeInTheDocument();
  });

  it.each(["profile", "behavior"] as const)(
    "keeps keyboard focus on the scope radio when switching scope with arrow keys (%s tab)",
    async (tab) => {
      useSettingsStore.getState().setActiveTab(tab);
      useTabStore.getState().openRepoTab(mockRepo1);

      render(<SettingsModal currentRepoPath={mockRepo1.path} />);

      const repoBtn = await screen.findByTestId("scope-btn-repo");
      repoBtn.focus();
      fireEvent.keyDown(repoBtn, { key: "ArrowLeft" });

      const globalBtn = screen.getByTestId("scope-btn-global");
      expect(globalBtn).toHaveAttribute("aria-checked", "true");
      expect(document.activeElement).toBe(globalBtn);

      fireEvent.keyDown(globalBtn, { key: "ArrowRight" });

      const repoBtnAfter = screen.getByTestId("scope-btn-repo");
      expect(repoBtnAfter).toHaveAttribute("aria-checked", "true");
      expect(document.activeElement).toBe(repoBtnAfter);
    }
  );
});
