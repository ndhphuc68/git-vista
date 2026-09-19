import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PruneConfirmModal } from "../components/remote/PruneConfirmModal";
import { invokeCommand } from "../ipc/client";
import { useToastStore } from "../store/useToastStore";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    pruneRemote: vi.fn(),
  },
}));

/**
 * Characterization tests: these pin the behaviour the modal had BEFORE being
 * migrated onto the shared Modal primitive, so the migration can be shown to
 * be a mechanical replacement (convention #5).
 */
describe("PruneConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    repoPath: "/test/repo",
    remoteName: "origin",
  };

  it("does not render when closed", () => {
    render(<PruneConfirmModal {...defaults} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the target remote and the safety notice", () => {
    render(<PruneConfirmModal {...defaults} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("origin")).toBeInTheDocument();
    expect(screen.getByText(/nhánh làm việc cá nhân/i)).toBeInTheDocument();
  });

  it("is labelled by its title for screen readers", () => {
    render(<PruneConfirmModal {...defaults} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(/dọn dẹp nhánh mồ côi/i);
  });

  it("reports how many branches were pruned and closes", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(invokeCommand.pruneRemote).mockResolvedValue({
      pruned_branches: ["origin/old-a", "origin/old-b"],
    } as never);
    const showSuccess = vi.spyOn(useToastStore.getState(), "showSuccess");

    render(<PruneConfirmModal {...defaults} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /dọn dẹp ngay/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(invokeCommand.pruneRemote).toHaveBeenCalledWith("/test/repo", "origin");
    expect(onSuccess).toHaveBeenCalledWith(["origin/old-a", "origin/old-b"]);
    expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining("2"));
  });

  it("shows an info toast instead of success when nothing was pruned", async () => {
    const onClose = vi.fn();
    vi.mocked(invokeCommand.pruneRemote).mockResolvedValue({ pruned_branches: [] } as never);
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");
    const showSuccess = vi.spyOn(useToastStore.getState(), "showSuccess");

    render(<PruneConfirmModal {...defaults} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /dọn dẹp ngay/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("shows the error and stays open when pruning fails", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(invokeCommand.pruneRemote).mockRejectedValue(new Error("network unreachable"));

    render(<PruneConfirmModal {...defaults} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /dọn dẹp ngay/i }));

    expect(await screen.findByText(/network unreachable/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("closes on cancel without pruning", () => {
    const onClose = vi.fn();
    render(<PruneConfirmModal {...defaults} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(invokeCommand.pruneRemote).not.toHaveBeenCalled();
  });

  it("closes on the header close button", () => {
    const onClose = vi.fn();
    render(<PruneConfirmModal {...defaults} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<PruneConfirmModal {...defaults} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not react to Escape while closed", () => {
    const onClose = vi.fn();
    render(<PruneConfirmModal {...defaults} isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
