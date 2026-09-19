import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { BranchSidebar } from "../features/branch";
import { useRepoStore } from "../store/useRepoStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { invokeCommand } from "../ipc/client";
import { type TagItem } from "../ipc/bindings.generated";
import { qk } from "../domain/queryKeys";

const mockTags: TagItem[] = [
  {
    name: "v1.0.0",
    target_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    short_commit_id: "c1a2b3c",
    commit_summary: "Initial release",
    is_annotated: true,
    message: "First official release",
    tagger_name: "GitVista User",
    tagger_email: "user@gitvista.dev",
    timestamp_sec: 1700000000,
  },
  {
    name: "v0.9.0",
    target_commit_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    short_commit_id: "a1b2c3d",
    commit_summary: "Beta release",
    is_annotated: false,
    message: null,
    tagger_name: null,
    tagger_email: null,
    timestamp_sec: 1690000000,
  },
];

describe("BranchSidebar - Tags Management", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    useRepoStore.getState().setRepo({
      path: "d:/project-v3",
      name: "project-v3",
      is_bare: false,
      head_branch: "main",
      head_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    });

    vi.spyOn(invokeCommand, "getTags").mockResolvedValue(mockTags);
    vi.spyOn(invokeCommand, "checkoutTag").mockResolvedValue(undefined);
    vi.spyOn(invokeCommand, "pushTag").mockResolvedValue(undefined);
    vi.spyOn(invokeCommand, "deleteTag").mockResolvedValue(undefined);
  });

  it("renders tag list with short commit SHA when accordion is opened", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    // Expand tags accordion
    const tagsAccordionBtn = screen.getByRole("button", { name: /TAGS/i });
    expect(tagsAccordionBtn).toBeInTheDocument();
    fireEvent.click(tagsAccordionBtn);

    await waitFor(() => {
      expect(screen.getByText("v1.0.0")).toBeInTheDocument();
      expect(screen.getByText("c1a2b3c")).toBeInTheDocument();
      expect(screen.getByText("v0.9.0")).toBeInTheDocument();
      expect(screen.getByText("a1b2c3d")).toBeInTheDocument();
    });
  });

  it("opens CreateTagModal when clicking the (+) button in Tags header", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    const createTagBtn = screen.getByLabelText(/Tạo thẻ mới/i);
    expect(createTagBtn).toBeInTheDocument();

    fireEvent.click(createTagBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Tạo thẻ mới/i })).toBeInTheDocument();
    });
  });

  it("opens tag context menu with Checkout, Create Branch, Push, and Delete actions", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    // Expand tags accordion
    const tagsAccordionBtn = screen.getByRole("button", { name: /TAGS/i });
    fireEvent.click(tagsAccordionBtn);

    await waitFor(() => {
      expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    });

    // Click menu button for v1.0.0
    const tagMenuBtn = screen.getByLabelText("Menu thao tác thẻ v1.0.0");
    fireEvent.click(tagMenuBtn);

    // Verify all 4 actions are present
    const checkoutBtn = screen.getByRole("button", { name: /Chuyển sang thẻ này/i });
    const createBranchBtn = screen.getByRole("button", { name: /Tạo nhánh mới từ thẻ này/i });
    const pushBtn = screen.getByRole("button", { name: /Đẩy thẻ lên máy chủ/i });
    const deleteBtn = screen.getByRole("button", { name: /Xoá thẻ/i });

    expect(checkoutBtn).toBeInTheDocument();
    expect(createBranchBtn).toBeInTheDocument();
    expect(pushBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();
  });

  it("handles tag checkout action and shows toast notification", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /TAGS/i }));
    await waitFor(() => expect(screen.getByText("v1.0.0")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Menu thao tác thẻ v1.0.0"));
    const checkoutBtn = screen.getByRole("button", { name: /Chuyển sang thẻ này/i });
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(invokeCommand.checkoutTag).toHaveBeenCalledWith("d:/project-v3", "v1.0.0");
    });
  });

  it("handles push tag action and shows toast notification", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /TAGS/i }));
    await waitFor(() => expect(screen.getByText("v1.0.0")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Menu thao tác thẻ v1.0.0"));
    const pushBtn = screen.getByRole("button", { name: /Đẩy thẻ lên máy chủ/i });
    fireEvent.click(pushBtn);

    await waitFor(() => {
      expect(invokeCommand.pushTag).toHaveBeenCalledWith("d:/project-v3", "v1.0.0");
    });
  });

  it("opens CreateBranchModal targeting the tag's commit when choosing Create Branch from Tag", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /TAGS/i }));
    await waitFor(() => expect(screen.getByText("v1.0.0")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Menu thao tác thẻ v1.0.0"));
    const createBranchBtn = screen.getByRole("button", { name: /Tạo nhánh mới từ thẻ này/i });
    fireEvent.click(createBranchBtn);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("c1a2b3c")).toBeInTheDocument();
    });
  });

  it("opens DeleteTagModal when choosing Delete Tag from context menu", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /TAGS/i }));
    await waitFor(() => expect(screen.getByText("v1.0.0")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Menu thao tác thẻ v1.0.0"));
    const deleteBtn = screen.getByRole("button", { name: /Xoá thẻ/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("v1.0.0")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Xoá thẻ/i })).toBeInTheDocument();
    });
  });

  it("refreshes the tag list after a tag is deleted without the sidebar invalidating it", async () => {
    // The tag list refresh is owned by useDeleteTag, not by the sidebar's
    // invalidateRepo. This test fails if that ownership moves back.
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <BranchSidebar />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /TAGS/i }));
    await waitFor(() => expect(screen.getByText("v1.0.0")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Menu thao tác thẻ v1.0.0"));
    fireEvent.click(screen.getByRole("button", { name: /Xoá thẻ/i }));

    const dialog = await screen.findByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /Xoá thẻ/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(invokeCommand.deleteTag).toHaveBeenCalledWith("d:/project-v3", "v1.0.0", false);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all("d:/project-v3") });
    });
  });
});
