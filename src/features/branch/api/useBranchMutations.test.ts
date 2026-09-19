import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { qk } from "../../../domain/queryKeys";
import { useCheckoutBranch, useCreateBranch, useDeleteBranch, useRenameBranch } from "./index";

vi.mock("../../../ipc/client", () => ({
	invokeCommand: {
		getBranches: vi.fn().mockResolvedValue({
			current_branch: "main",
			is_detached: false,
			local: [],
			remote: [],
			tags: [],
		}),
		checkoutBranch: vi.fn().mockResolvedValue(undefined),
		createBranch: vi.fn().mockResolvedValue(undefined),
		renameBranch: vi.fn().mockResolvedValue(undefined),
		deleteBranch: vi.fn().mockResolvedValue(undefined),
	},
}));

const REPO = "/tmp/repo";

function makeWrapper(client: QueryClient) {
	return ({ children }: { children: React.ReactNode }) =>
		React.createElement(QueryClientProvider, { client }, children);
}

describe("branch mutation hooks", () => {
	let client: QueryClient;
	let invalidateSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		client = new QueryClient({
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		});
		invalidateSpy = vi.spyOn(client, "invalidateQueries");
	});

	it.each([
		["useCheckoutBranch", useCheckoutBranch, { name: "develop" }],
		["useCreateBranch", useCreateBranch, { name: "feature/x" }],
		["useRenameBranch", useRenameBranch, { oldName: "a", newName: "b" }],
		["useDeleteBranch", useDeleteBranch, { name: "old" }],
	] as const)("%s invalidates the whole repo scope after success", async (_label, hook, vars) => {
		const { result } = renderHook(() => hook(REPO), { wrapper: makeWrapper(client) });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		result.current.mutate(vars as any);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: qk.repo.all(REPO) });
	});

	it("useCheckoutBranch does not invalidate when checkout fails", async () => {
		const { invokeCommand } = await import("../../../ipc/client");
		vi.mocked(invokeCommand.checkoutBranch).mockRejectedValueOnce(new Error("CHECKOUT_CONFLICT"));

		const { result } = renderHook(() => useCheckoutBranch(REPO), { wrapper: makeWrapper(client) });
		result.current.mutate({ name: "develop" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(invalidateSpy).not.toHaveBeenCalled();
	});

	it("useCheckoutBranch surfaces the original error so conflict detection still works", async () => {
		const { invokeCommand } = await import("../../../ipc/client");
		vi.mocked(invokeCommand.checkoutBranch).mockRejectedValueOnce(new Error("CHECKOUT_CONFLICT"));

		const { result } = renderHook(() => useCheckoutBranch(REPO), { wrapper: makeWrapper(client) });
		result.current.mutate({ name: "develop" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as Error).message).toContain("CHECKOUT_CONFLICT");
	});

	it("useDeleteBranch forwards the force flag", async () => {
		const { invokeCommand } = await import("../../../ipc/client");
		const { result } = renderHook(() => useDeleteBranch(REPO), { wrapper: makeWrapper(client) });

		result.current.mutate({ name: "old", force: true });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(invokeCommand.deleteBranch).toHaveBeenCalledWith(REPO, "old", true);
	});

	it("useDeleteBranch resolves with the undo token", async () => {
		// delete_branch returns a token the undo toast needs. A mutationFn that
		// forgets to return it still type-checks and still passes every other
		// test here, so this assertion is the only thing guarding it.
		const { invokeCommand } = await import("../../../ipc/client");
		vi.mocked(invokeCommand.deleteBranch).mockResolvedValueOnce("undo-token-123");

		const { result } = renderHook(() => useDeleteBranch(REPO), { wrapper: makeWrapper(client) });
		const token = await result.current.mutateAsync({ name: "old" });

		expect(token).toBe("undo-token-123");
	});
});
