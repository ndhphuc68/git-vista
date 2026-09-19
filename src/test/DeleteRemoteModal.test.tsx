import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeleteRemoteModal } from "../features/remote/components/DeleteRemoteModal";
import { invokeCommand } from "../ipc/client";
import { useToastStore } from "../store/useToastStore";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    removeRemote: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const remote = {
  name: "origin",
  fetch_url: "https://github.com/user/repo.git",
  push_url: "https://github.com/user/repo.git",
  branch_count: 5,
  is_default: true,
};

/**
 * Characterization tests: these pin the behaviour the modal had BEFORE being
 * migrated onto the shared Modal primitive, so the migration can be shown to
 * be a mechanical replacement (convention #5).
 */
describe("DeleteRemoteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    repoPath: "/test/repo",
    remote,
  };

  it("does not render when closed", () => {
    renderWithClient(<DeleteRemoteModal {...defaults} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render without a remote", () => {
    renderWithClient(<DeleteRemoteModal {...defaults} remote={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the remote name, its url and the safety warning", () => {
    renderWithClient(<DeleteRemoteModal {...defaults} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("origin")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/user/repo.git")).toBeInTheDocument();
    expect(screen.getByText(/chỉ gỡ bỏ liên kết cấu hình remote/i)).toBeInTheDocument();
  });

  it("is labelled by its title for screen readers", () => {
    renderWithClient(<DeleteRemoteModal {...defaults} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent("Xoá máy chủ từ xa");
  });

  it("removes the remote, reports success and closes on confirm", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(invokeCommand.removeRemote).mockResolvedValue(undefined as never);
    const showSuccess = vi.spyOn(useToastStore.getState(), "showSuccess");

    renderWithClient(<DeleteRemoteModal {...defaults} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá Remote/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(invokeCommand.removeRemote).toHaveBeenCalledWith("/test/repo", "origin");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining("origin"));
  });

  it("shows the error and stays open when removal fails", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(invokeCommand.removeRemote).mockRejectedValue(new Error("remote is locked"));

    renderWithClient(<DeleteRemoteModal {...defaults} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá Remote/i }));

    expect(await screen.findByText(/remote is locked/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("closes on cancel without touching the remote", () => {
    const onClose = vi.fn();
    renderWithClient(<DeleteRemoteModal {...defaults} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(invokeCommand.removeRemote).not.toHaveBeenCalled();
  });

  it("closes on the header close button", () => {
    const onClose = vi.fn();
    renderWithClient(<DeleteRemoteModal {...defaults} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderWithClient(<DeleteRemoteModal {...defaults} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not react to Escape while closed", () => {
    const onClose = vi.fn();
    renderWithClient(<DeleteRemoteModal {...defaults} isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears a previous error when reopened", async () => {
    vi.mocked(invokeCommand.removeRemote).mockRejectedValue(new Error("remote is locked"));
    const { rerender } = renderWithClient(<DeleteRemoteModal {...defaults} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Xoá Remote/i }));
    expect(await screen.findByText(/remote is locked/i)).toBeInTheDocument();

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={queryClient}>
        <DeleteRemoteModal {...defaults} isOpen={false} onClose={vi.fn()} />
      </QueryClientProvider>
    );
    rerender(
      <QueryClientProvider client={queryClient}>
        <DeleteRemoteModal {...defaults} isOpen={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.queryByText(/remote is locked/i)).not.toBeInTheDocument());
  });
});
