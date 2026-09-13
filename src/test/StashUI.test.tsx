import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateStashModal } from "../components/stash/CreateStashModal";

describe("CreateStashModal Component", () => {
  it("renders input, untracked checkbox, and calls onSaveStash", async () => {
    const handleSave = vi.fn().mockResolvedValue("oid123");
    const handleClose = vi.fn();

    render(
      <CreateStashModal
        isOpen={true}
        onClose={handleClose}
        repoPath="/test/repo"
        onSaveStash={handleSave}
      />
    );

    expect(screen.getByText("Luu tam thay doi (Stash)")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Mo ta noi dung stash/i);
    fireEvent.change(input, { target: { value: "My temp changes" } });

    const checkbox = screen.getByLabelText(/Bao gom ca cac file chua theo doi/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: "Luu Stash" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My temp changes", true);
    });
  });
});