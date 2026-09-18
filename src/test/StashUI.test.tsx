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

    expect(screen.getByText("Lưu tạm thay đổi (Stash)")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Mô tả nội dung stash/i);
    fireEvent.change(input, { target: { value: "My temp changes" } });

    const checkbox = screen.getByLabelText(/chưa theo dõi/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: "Lưu Stash" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My temp changes", true);
    });
  });
});
