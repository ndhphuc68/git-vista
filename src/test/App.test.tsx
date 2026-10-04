import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { App } from "../App";
import { useSettingsStore } from "../store/useSettingsStore";
import { useRepoStore } from "../store/useRepoStore";
import { useTabStore } from "../store/useTabStore";
import { useViewStore } from "../store/useViewStore";
import { useCommandPaletteStore } from "../store/useCommandPaletteStore";

describe("Visual Git Client - M1 App Shell", () => {
  beforeEach(() => {
    localStorage.clear();
    const settings = useSettingsStore.getState();
    settings.setTheme("light");
    settings.setColorblind(false);
    settings.setLocale("vi");
    useRepoStore.getState().clearRepo();
    useTabStore.getState().reset();
    useViewStore.getState().setActiveScreen("history");
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

  it("không còn nút chuyển đổi theme Light/Dark do ứng dụng sử dụng bộ khung màu thống nhất", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(useRepoStore.getState().currentRepo).not.toBeNull();
    });

    // Theme switcher buttons in ControlsBar no longer appear
    expect(screen.queryByTitle("Theme: dark")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Theme: light")).not.toBeInTheDocument();

    const settingsBtn = screen.getByTitle("Cài đặt (Theme, Ngôn ngữ)");
    fireEvent.click(settingsBtn);

    // Theme switcher buttons in Settings > Appearance modal no longer appear
    expect(screen.queryByTitle("Theme: dark")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Theme: light")).not.toBeInTheDocument();
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

  it("hiển thị SplashScreen khi skipSplash là false và chuyển vào app khi kết thúc", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      render(<App skipSplash={false} />);
      expect(screen.getByTestId("splash-screen")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2100);
      });

      expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("hỗ trợ đa tab: mở repo tạo tab mới, chuyển về Home và quay lại repo tab tức thì", async () => {
    render(<App />);

    // Open the repo
    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("project-v3"));

    await waitFor(() => {
      expect(screen.getByTestId("tab-d:/project-v3")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });

    // Click back to the Home tab in WindowTabBar
    fireEvent.click(screen.getByTestId("tab-home"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "GitVista" })).toBeInTheDocument();
    });

    // The repo tab is still in WindowTabBar; click it to go back
    fireEvent.click(screen.getByTestId("tab-d:/project-v3"));

    await waitFor(() => {
      expect(screen.getByText("feat(m1): visual git viewer")).toBeInTheDocument();
    });
  });
});
