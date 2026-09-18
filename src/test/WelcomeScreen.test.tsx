import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WelcomeScreen } from "../components/welcome/WelcomeScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("WelcomeScreen", () => {
  it("renders open button and recent repos list", async () => {
    const onSelect = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={onSelect} />
      </QueryClientProvider>
    );

    expect(screen.getByText("GitVista")).toBeInTheDocument();
    expect(screen.getByText(/Open Folder\.\.\.|Mở thư mục\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("project-v3"));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });
  });

  it("calls clearRecentRepos when clicking clear button", async () => {
    const { invokeCommand } = await import("../ipc/client");
    const clearSpy = vi.spyOn(invokeCommand, "clearRecentRepos").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("clear-recents-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("clear-recents-btn"));
    expect(clearSpy).toHaveBeenCalled();
  });

  it("calls removeRecentRepo when clicking remove button on a repo item", async () => {
    const { invokeCommand } = await import("../ipc/client");
    const removeSpy = vi.spyOn(invokeCommand, "removeRecentRepo").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("remove-recent-d:/project-v3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("remove-recent-d:/project-v3"));
    expect(removeSpy).toHaveBeenCalledWith("d:/project-v3");
  });

  it("opens CloneModal when clicking Clone button", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    const cloneBtn = screen.getByTestId("welcome-clone-btn");
    expect(cloneBtn).toBeInTheDocument();

    fireEvent.click(cloneBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Clone Repository")).toBeInTheDocument();
  });

  it("filters recent repos list when typing in search input", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter repositories|Lọc dự án/i);
    expect(searchInput).toBeInTheDocument();

    // Type non-matching search term
    fireEvent.change(searchInput, { target: { value: "non-existent-repo" } });
    expect(screen.queryByText("project-v3")).not.toBeInTheDocument();
    expect(
      screen.getByText(/No repositories found matching|Không tìm thấy dự án nào/i)
    ).toBeInTheDocument();

    // Type matching search term
    fireEvent.change(searchInput, { target: { value: "project" } });
    expect(screen.getByText("project-v3")).toBeInTheDocument();
  });

  it("handles Ctrl+O and Ctrl+N shortcuts on WelcomeScreen", async () => {
    const { invokeCommand } = await import("../ipc/client");
    const selectFolderSpy = vi.spyOn(invokeCommand, "selectRepoFolder").mockResolvedValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    // Press Ctrl+O
    fireEvent.keyDown(window, { key: "o", ctrlKey: true });
    expect(selectFolderSpy).toHaveBeenCalled();

    // Press Ctrl+N -> opens Clone Modal
    fireEvent.keyDown(window, { key: "n", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports switching languages dynamically between EN and VI", async () => {
    const { useSettingsStore } = await import("../store/useSettingsStore");
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    // Default English
    useSettingsStore.getState().setLocale("en");
    rerender(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );
    expect(screen.getByText("Open Folder...")).toBeInTheDocument();
    expect(screen.getByText("Recent Repositories")).toBeInTheDocument();

    // Switch to Vietnamese
    useSettingsStore.getState().setLocale("vi");
    rerender(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );
    expect(screen.getByText("Mở thư mục...")).toBeInTheDocument();
    expect(screen.getByText("Dự án gần đây")).toBeInTheDocument();

    // Reset back to English
    useSettingsStore.getState().setLocale("en");
  });

  it("copies repo path to clipboard when clicking copy button", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    const copyBtn = screen.getByLabelText(/Copy path|Sao chép đường dẫn/i);
    expect(copyBtn).toBeInTheDocument();
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("d:/project-v3");
  });

  it("pins and unpins a repository when clicking star button", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("project-v3")).toBeInTheDocument();
    });

    const pinBtn = screen.getByLabelText(/Pin to top|Ghim lên đầu/i);
    expect(pinBtn).toBeInTheDocument();

    // Click to pin
    fireEvent.click(pinBtn);
    expect(screen.getByLabelText(/Unpin|Bỏ ghim/i)).toBeInTheDocument();

    // Click to unpin
    fireEvent.click(screen.getByLabelText(/Unpin|Bỏ ghim/i));
    expect(screen.getByLabelText(/Pin to top|Ghim lên đầu/i)).toBeInTheDocument();
  });

  it("opens settings modal when clicking settings button on header", async () => {
    const { useSettingsStore } = await import("../store/useSettingsStore");
    useSettingsStore.getState().closeSettings();

    render(
      <QueryClientProvider client={queryClient}>
        <WelcomeScreen onSelectRepo={vi.fn()} />
      </QueryClientProvider>
    );

    const settingsBtn = screen.getByRole("button", { name: /Cài đặt|Settings/i });
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);

    expect(useSettingsStore.getState().isSettingsOpen).toBe(true);
  });
});
