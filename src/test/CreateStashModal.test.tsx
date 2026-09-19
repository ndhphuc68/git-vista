import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateStashModal } from "../features/stash";

/**
 * Characterization tests: these pin the behaviour the modal had BEFORE being
 * migrated onto the shared Modal primitive, so the migration can be shown to
 * be a mechanical replacement (convention #5).
 */
describe("CreateStashModal", () => {
  const defaults = {
    isOpen: true,
    repoPath: "/test/repo",
  };

  const messageInput = () => screen.getByLabelText(/Mô tả/i);
  const untrackedCheckbox = () => screen.getByLabelText(/chưa theo dõi/i);
  const submit = () => screen.getByRole("button", { name: /Lưu Stash/i });

  it("does not render when closed", () => {
    render(
      <CreateStashModal {...defaults} isOpen={false} onClose={vi.fn()} onSaveStash={vi.fn()} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts with an empty message and untracked unchecked", () => {
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(messageInput()).toHaveValue("");
    expect(untrackedCheckbox()).not.toBeChecked();
  });

  // Deliberate change, not a mechanical carry-over: the original had no
  // autofocus at all. Under the shared Modal, focus has to land somewhere,
  // and the default first-focusable is the header close button — worse than
  // before. Pointing it at the message field is the intended behaviour, so
  // it is pinned here rather than left implicit.
  it("focuses the message field on open", async () => {
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={vi.fn()} />);

    await waitFor(() => expect(document.activeElement).toBe(messageInput()));
  });

  it("is labelled by its title for screen readers", () => {
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={vi.fn()} />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(/Lưu tạm thay đổi/i);
  });

  it("saves with the typed message and the untracked flag", async () => {
    const onSaveStash = vi.fn().mockResolvedValue("stash@{0}");
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={onSaveStash} />);

    fireEvent.change(messageInput(), { target: { value: "wip: refactor" } });
    fireEvent.click(untrackedCheckbox());
    fireEvent.click(submit());

    await waitFor(() => expect(onSaveStash).toHaveBeenCalledWith("wip: refactor", true));
  });

  it("allows saving with an empty message, since the description is optional", async () => {
    const onSaveStash = vi.fn().mockResolvedValue("stash@{0}");
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={onSaveStash} />);

    expect(submit()).toBeEnabled();
    fireEvent.click(submit());

    await waitFor(() => expect(onSaveStash).toHaveBeenCalledWith("", false));
  });

  it("resets the message and checkbox when reopened", () => {
    const { rerender } = render(
      <CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={vi.fn()} />
    );
    fireEvent.change(messageInput(), { target: { value: "leftover" } });
    fireEvent.click(untrackedCheckbox());

    rerender(
      <CreateStashModal {...defaults} isOpen={false} onClose={vi.fn()} onSaveStash={vi.fn()} />
    );
    rerender(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={vi.fn()} />);

    expect(messageInput()).toHaveValue("");
    expect(untrackedCheckbox()).not.toBeChecked();
  });

  it("disables the inputs and shows a saving label while in flight", async () => {
    let release: (v: string) => void = () => {};
    const onSaveStash = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        })
    );
    render(<CreateStashModal {...defaults} onClose={vi.fn()} onSaveStash={onSaveStash} />);

    fireEvent.click(submit());

    expect(await screen.findByRole("button", { name: /Đang lưu/i })).toBeDisabled();
    expect(messageInput()).toBeDisabled();

    release("stash@{0}");
    await waitFor(() => expect(screen.getByRole("button", { name: /Lưu Stash/i })).toBeEnabled());
  });

  describe("closing", () => {
    it("closes on Escape", () => {
      const onClose = vi.fn();
      render(<CreateStashModal {...defaults} onClose={onClose} onSaveStash={vi.fn()} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not react to Escape while closed", () => {
      const onClose = vi.fn();
      render(
        <CreateStashModal {...defaults} isOpen={false} onClose={onClose} onSaveStash={vi.fn()} />
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on the header close button and on cancel, without saving", () => {
      const onClose = vi.fn();
      const onSaveStash = vi.fn();
      render(<CreateStashModal {...defaults} onClose={onClose} onSaveStash={onSaveStash} />);

      fireEvent.click(screen.getByLabelText("Đóng"));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /^Huỷ/i }));
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(onSaveStash).not.toHaveBeenCalled();
    });
  });
});
