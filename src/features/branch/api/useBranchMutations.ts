import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/**
 * Every branch mutation refreshes the same scope: a branch change moves HEAD,
 * the commit graph and the working tree status all at once. qk.repo.all covers
 * them because every key is prefixed with ["repo", repoPath].
 *
 * Errors are deliberately NOT wrapped — callers read the message to tell a
 * checkout conflict apart from other failures.
 */
function invalidateRepoScope(queryClient: QueryClient, repoPath: string) {
	queryClient.invalidateQueries({ queryKey: qk.repo.all(repoPath) });
}

export interface CheckoutBranchVars {
	name: string;
}

export function useCheckoutBranch(repoPath: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (vars: CheckoutBranchVars) => invokeCommand.checkoutBranch(repoPath, vars.name),
		onSuccess: () => invalidateRepoScope(queryClient, repoPath),
	});
}

export interface CreateBranchVars {
	name: string;
	targetCommit?: string | null;
	checkout?: boolean;
}

export function useCreateBranch(repoPath: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (vars: CreateBranchVars) =>
			invokeCommand.createBranch(repoPath, vars.name, vars.targetCommit, vars.checkout),
		onSuccess: () => invalidateRepoScope(queryClient, repoPath),
	});
}

export interface RenameBranchVars {
	oldName: string;
	newName: string;
}

export function useRenameBranch(repoPath: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (vars: RenameBranchVars) =>
			invokeCommand.renameBranch(repoPath, vars.oldName, vars.newName),
		onSuccess: () => invalidateRepoScope(queryClient, repoPath),
	});
}

export interface DeleteBranchVars {
	name: string;
	force?: boolean;
}

/**
 * Deletes a branch and resolves with the undo token the backend returns.
 * The token must be passed through — the undo toast is built from it.
 */
export function useDeleteBranch(repoPath: string) {
	const queryClient = useQueryClient();
	return useMutation<string, unknown, DeleteBranchVars>({
		mutationFn: (vars) => invokeCommand.deleteBranch(repoPath, vars.name, vars.force),
		onSuccess: () => invalidateRepoScope(queryClient, repoPath),
	});
}
