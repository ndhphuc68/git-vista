import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTagModal } from "../features/tag";
import { invokeCommand } from "../ipc/client";

vi.mock("../ipc/client", () => ({
  invokeCommand: {
    createTag: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CreateTagModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    renderWithClient(
      <CreateTagModal
        isOpen={false}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders target commit SHA and summary", () => {
    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
        targetCommitSummary="feat: initial commit"
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("a1b2c3d")).toBeInTheDocument();
    expect(screen.getByText(/- feat: initial commit/i)).toBeInTheDocument();
  });

  it("auto-sanitizes spaces to dash and removes invalid characters", () => {
    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );
    const input = screen.getByPlaceholderText(/v1\.0\.0/i);
    fireEvent.change(input, { target: { value: "v1.0 release:new*~^" } });
    expect(input).toHaveValue("v1.0-releasenew");
  });

  it("submits valid lightweight tag via invokeCommand.createTag", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    (invokeCommand.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );

    const input = screen.getByPlaceholderText(/v1\.0\.0/i);
    fireEvent.change(input, { target: { value: "v1.0.0" } });

    const submitBtn = screen.getByRole("button", { name: /tạo thẻ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createTag).toHaveBeenCalledWith(
        "/test/repo",
        "v1.0.0",
        "a1b2c3d4e5f6",
        undefined
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("toggles annotated tag and submits with message", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    (invokeCommand.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );

    const input = screen.getByPlaceholderText(/v1\.0\.0/i);
    fireEvent.change(input, { target: { value: "v1.1.0" } });

    const annotatedCheckbox = screen.getByRole("checkbox");
    expect(screen.queryByPlaceholderText(/ghi chú phát hành/i)).not.toBeInTheDocument();

    fireEvent.click(annotatedCheckbox);
    const messageInput = screen.getByPlaceholderText(/ghi chú phát hành/i);
    expect(messageInput).toBeInTheDocument();

    fireEvent.change(messageInput, { target: { value: "Release version 1.1.0" } });

    const submitBtn = screen.getByRole("button", { name: /tạo thẻ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(invokeCommand.createTag).toHaveBeenCalledWith(
        "/test/repo",
        "v1.1.0",
        "a1b2c3d4e5f6",
        "Release version 1.1.0"
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("displays validation errors for empty name and empty annotated message", async () => {
    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={vi.fn()}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /tạo thẻ/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Vui lòng nhập tên thẻ")).toBeInTheDocument();
    expect(invokeCommand.createTag).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText(/v1\.0\.0/i);
    fireEvent.change(input, { target: { value: "v2.0.0" } });

    const annotatedCheckbox = screen.getByRole("checkbox");
    fireEvent.click(annotatedCheckbox);

    fireEvent.click(submitBtn);
    expect(screen.getByText("Thẻ có chú thích yêu cầu nhập thông điệp")).toBeInTheDocument();
    expect(invokeCommand.createTag).not.toHaveBeenCalled();
  });

  it("closes when cancel button is clicked or Escape key pressed", () => {
    const onClose = vi.fn();
    renderWithClient(
      <CreateTagModal
        isOpen={true}
        onClose={onClose}
        repoPath="/test/repo"
        targetCommitId="a1b2c3d4e5f6"
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
