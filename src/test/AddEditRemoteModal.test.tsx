import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddEditRemoteModal } from "../components/remote/AddEditRemoteModal";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    addRemote: vi.fn(),
    renameRemote: vi.fn(),
    setRemoteUrl: vi.fn(),
  },
}));

const existing = {
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
describe("AddEditRemoteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    repoPath: "/test/repo",
  };

  const nameInput = () => screen.getByLabelText(/Tên Remote/i);
  const fetchInput = () => screen.getByLabelText(/URL nhận/i);
  const submit = () => screen.getByRole("button", { name: /Thêm Remote|Lưu thay đổi/i });

  it("does not render when closed", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} isOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts empty in add mode", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(nameInput()).toHaveValue("");
    expect(fetchInput()).toHaveValue("");
    expect(screen.getByRole("button", { name: /Thêm Remote/i })).toBeInTheDocument();
  });

  it("prefills the existing remote in edit mode", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} initialRemote={existing} />);

    expect(nameInput()).toHaveValue("origin");
    expect(fetchInput()).toHaveValue("https://github.com/user/repo.git");
    expect(screen.getByRole("button", { name: /Lưu thay đổi/i })).toBeInTheDocument();
  });

  it("is labelled by its title for screen readers", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(/Thêm máy chủ từ xa/i);
  });

  it("strips characters git forbids in a remote name", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);

    fireEvent.change(nameInput(), { target: { value: "up stream~^:?*" } });

    expect(nameInput()).toHaveValue("upstream");
  });

  it("keeps submit disabled until both required fields are filled", () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);
    expect(submit()).toBeDisabled();

    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    expect(submit()).toBeDisabled();

    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    expect(submit()).toBeEnabled();
  });

  it("adds the remote and closes on submit", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(invokeCommand.addRemote).mockResolvedValue(undefined as never);

    render(<AddEditRemoteModal {...defaults} onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.click(submit());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(invokeCommand.addRemote).toHaveBeenCalledWith(
      "/test/repo",
      "upstream",
      "https://example.com/a.git"
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("submits when Enter is pressed in the form", async () => {
    const onClose = vi.fn();
    vi.mocked(invokeCommand.addRemote).mockResolvedValue(undefined as never);

    const { container } = render(<AddEditRemoteModal {...defaults} onClose={onClose} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(invokeCommand.addRemote).toHaveBeenCalledTimes(1));
  });

  it("sends a separate push url only when the checkbox is ticked", async () => {
    vi.mocked(invokeCommand.addRemote).mockResolvedValue(undefined as never);
    vi.mocked(invokeCommand.setRemoteUrl).mockResolvedValue(undefined as never);

    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/URL đẩy/i), {
      target: { value: "git@example.com:a.git" },
    });
    fireEvent.click(submit());

    await waitFor(() =>
      expect(invokeCommand.setRemoteUrl).toHaveBeenCalledWith(
        "/test/repo",
        "upstream",
        "https://example.com/a.git",
        "git@example.com:a.git"
      )
    );
  });

  it("renames first when the name changed in edit mode", async () => {
    vi.mocked(invokeCommand.renameRemote).mockResolvedValue(undefined as never);
    vi.mocked(invokeCommand.setRemoteUrl).mockResolvedValue(undefined as never);

    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} initialRemote={existing} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.click(submit());

    await waitFor(() =>
      expect(invokeCommand.renameRemote).toHaveBeenCalledWith("/test/repo", "origin", "upstream")
    );
    expect(invokeCommand.setRemoteUrl).toHaveBeenCalledWith(
      "/test/repo",
      "upstream",
      existing.fetch_url,
      null
    );
  });

  it("rejects a name that starts with a dash", async () => {
    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);
    fireEvent.change(nameInput(), { target: { value: "-bad" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.click(submit());

    expect(await screen.findByText(/không được chứa ký tự đặc biệt/i)).toBeInTheDocument();
    expect(invokeCommand.addRemote).not.toHaveBeenCalled();
  });

  it("shows the error and stays open when adding fails", async () => {
    const onClose = vi.fn();
    vi.mocked(invokeCommand.addRemote).mockRejectedValue(new Error("remote already exists"));

    render(<AddEditRemoteModal {...defaults} onClose={onClose} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.click(submit());

    expect(await screen.findByText(/remote already exists/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears the error as soon as the user edits a field again", async () => {
    vi.mocked(invokeCommand.addRemote).mockRejectedValue(new Error("remote already exists"));

    render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);
    fireEvent.change(nameInput(), { target: { value: "upstream" } });
    fireEvent.change(fetchInput(), { target: { value: "https://example.com/a.git" } });
    fireEvent.click(submit());
    expect(await screen.findByText(/remote already exists/i)).toBeInTheDocument();

    fireEvent.change(nameInput(), { target: { value: "upstream2" } });

    expect(screen.queryByText(/remote already exists/i)).not.toBeInTheDocument();
  });

  it("closes on cancel, the header button and Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(<AddEditRemoteModal {...defaults} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Đóng"));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(<AddEditRemoteModal {...defaults} onClose={onClose} isOpen={false} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  describe("initial focus", () => {
    it("focuses the name field when adding", async () => {
      render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} />);

      await waitFor(() => expect(document.activeElement).toBe(nameInput()));
    });

    it("focuses the fetch url field when editing, since the name already exists", async () => {
      render(<AddEditRemoteModal {...defaults} onClose={vi.fn()} initialRemote={existing} />);

      await waitFor(() => expect(document.activeElement).toBe(fetchInput()));
    });
  });
});
