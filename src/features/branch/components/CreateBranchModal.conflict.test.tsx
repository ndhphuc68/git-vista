import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBranchModal } from "./CreateBranchModal";
import { invokeCommand } from "../../../ipc/client";

vi.mock("../../../ipc/client", () => ({
  invokeCommand: {
    createBranch: vi.fn(),
    getBranches: vi.fn(),
    saveStash: vi.fn(),
    popStash: vi.fn(),
  },
}));

const mocked = vi.mocked(invokeCommand);
const CONFLICT = { type: "InvalidOperation", message: "CHECKOUT_CONFLICT: dirty" };

function renderModal(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CreateBranchModal isOpen onClose={onClose} repoPath="/repo" targetCommit="refs/heads/dev" />
    </QueryClientProvider>
  );
  return onClose;
}

async function submitName(name: string) {
  fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo nhánh" }));
}

describe("CreateBranchModal checkout conflict", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getBranches.mockResolvedValue({
      current_branch: "main",
      is_detached: false,
      local: [],
      remote: [],
      tags: [],
    });
  });

  it("offers stash and create-only only for a checkout conflict", async () => {
    mocked.createBranch.mockRejectedValue(new Error("some other failure"));
    renderModal();

    await submitName("feat-x");

    expect(await screen.findByRole("alert")).toHaveTextContent("some other failure");
    expect(screen.queryByRole("button", { name: /Stash & tạo nhánh/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chỉ tạo nhánh" })).not.toBeInTheDocument();
  });

  it("stashes, creates with checkout and pops when Stash & create is clicked", async () => {
    mocked.createBranch.mockRejectedValueOnce(CONFLICT).mockResolvedValueOnce(undefined);
    mocked.saveStash.mockResolvedValue("oid");
    mocked.popStash.mockResolvedValue(undefined);
    const onClose = renderModal();

    await submitName("feat-x");
    fireEvent.click(await screen.findByRole("button", { name: /Stash & tạo nhánh/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocked.saveStash).toHaveBeenCalledWith("/repo", expect.any(String), true);
    expect(mocked.createBranch).toHaveBeenLastCalledWith("/repo", "feat-x", "refs/heads/dev", true);
    expect(mocked.popStash).toHaveBeenCalledWith("/repo", 0);
  });

  it("creates without checkout when Create only is clicked", async () => {
    mocked.createBranch.mockRejectedValueOnce(CONFLICT).mockResolvedValueOnce(undefined);
    const onClose = renderModal();

    await submitName("feat-x");
    fireEvent.click(await screen.findByRole("button", { name: "Chỉ tạo nhánh" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocked.createBranch).toHaveBeenLastCalledWith(
      "/repo",
      "feat-x",
      "refs/heads/dev",
      false
    );
    expect(mocked.saveStash).not.toHaveBeenCalled();
  });

  it("hides the conflict actions once the name is edited", async () => {
    mocked.createBranch.mockRejectedValue(CONFLICT);
    renderModal();

    await submitName("feat-x");
    await screen.findByRole("button", { name: "Chỉ tạo nhánh" });
    fireEvent.change(screen.getByLabelText("Tên nhánh mới"), { target: { value: "feat-y" } });

    expect(screen.queryByRole("button", { name: "Chỉ tạo nhánh" })).not.toBeInTheDocument();
  });
});
