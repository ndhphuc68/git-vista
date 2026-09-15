import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { App } from "../App";
import { useSettingsStore } from "../store/useSettingsStore";
import { useRepoStore } from "../store/useRepoStore";
import { useViewStore } from "../store/useViewStore";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";

describe("Visual Git Client - M1 App Shell", () => {
  beforeEach(() => {
    localStorage.clear();
    const settings = useSettingsStore.getState();
    settings.setTheme("light");
    settings.setColorblind(false);
    settings.setLocale("vi");
    settings.setMode("simple");
    useRepoStore.getState().clearRepo();
    useCommandPaletteStore.getState().close();
  });

  it("hiển thị WelcomeScreen khi chưa có repo nào được chọn", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "GitVista" })).toBeInTheDocument();
    expect(screen.getByText("Mở thư mục...")).toBeInTheDocument();
  });

  it("chọn một repo gần đây sẽ hiển thị RepoHeader, BranchSidebar, CommitGraph và CommitDetailPanel", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(useRepoStore.getState().currentRepo).not.toBeNull();
    });

    await waitFor(() => {
      expect(screen.getAllByText("main").length).toBeGreaterThan(0);
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });
  });

  it("chọn một commit trong graph sẽ hiển thị chi tiết commit và diff", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("feat(m1): visual git viewer"));

    await waitFor(() => {
      expect(screen.getByText("README.md")).toBeInTheDocument();
    });
  });

  it("cho phép chuyển đổi theme Light -> Dark và cập nhật data-theme vào HTML", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    const settingsBtn = screen.getByTitle("Cài đặt (Theme, Ngôn ngữ, Chế độ Git)");
    fireEvent.click(settingsBtn);

    const darkBtn = screen.getByTitle("Theme: dark");
    fireEvent.click(darkBtn);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
  });

  it("hiển thị ConflictResolverScreen khi activeScreen là conflict và activeConflictFile được chọn", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(useRepoStore.getState().currentRepo).not.toBeNull();
    });

    act(() => {
      useViewStore.getState().openConflictResolver("src/main.rs");
    });

    await waitFor(() => {
      expect(screen.getByText("src/main.rs")).toBeInTheDocument();
      expect(screen.getByText(/CỦA BẠN/i)).toBeInTheDocument();
    });
  });

  it("mở Command Palette khi bấm Ctrl+K", async () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tìm kiếm lệnh/i)).toBeInTheDocument();
    });
  });

  it("mở Bảng phím tắt khi bấm phím ?", async () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "?" });

    await waitFor(() => {
      expect(screen.getByText(/Bảng phím tắt/i)).toBeInTheDocument();
    });
  });
});
