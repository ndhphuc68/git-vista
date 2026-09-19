import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";
import { type PruneResult, type RemoteItem } from "../../../ipc/bindings.generated";

/**
 * Remote edits change two things: the remote list itself, and the
 * remote-tracking branches derived from it.
 *
 * Deliberately narrower than qk.repo.all — a remote change touches neither
 * the working tree nor HEAD, so refetching the status and the commit graph
 * would be wasted work.
 */
function invalidateRemoteScope(queryClient: QueryClient, repoPath: string) {
  queryClient.invalidateQueries({ queryKey: qk.remotes(repoPath) });
  queryClient.invalidateQueries({ queryKey: qk.branches(repoPath) });
}

export interface AddRemoteVars {
  name: string;
  url: string;
}

export function useAddRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<RemoteItem, unknown, AddRemoteVars>({
    mutationFn: (vars) => invokeCommand.addRemote(repoPath, vars.name, vars.url),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface RenameRemoteVars {
  oldName: string;
  newName: string;
}

export function useRenameRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: RenameRemoteVars) =>
      invokeCommand.renameRemote(repoPath, vars.oldName, vars.newName),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface RemoveRemoteVars {
  name: string;
}

export function useRemoveRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: RemoveRemoteVars) => invokeCommand.removeRemote(repoPath, vars.name),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface SetRemoteUrlVars {
  name: string;
  fetchUrl: string;
  pushUrl?: string | null;
}

export function useSetRemoteUrl(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: SetRemoteUrlVars) =>
      invokeCommand.setRemoteUrl(repoPath, vars.name, vars.fetchUrl, vars.pushUrl),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}

export interface PruneRemoteVars {
  remote: string;
  taskId?: string;
}

/** Prunes stale remote-tracking branches and resolves with what was removed. */
export function usePruneRemote(repoPath: string) {
  const queryClient = useQueryClient();
  return useMutation<PruneResult, unknown, PruneRemoteVars>({
    mutationFn: (vars) => invokeCommand.pruneRemote(repoPath, vars.remote, vars.taskId),
    onSuccess: () => invalidateRemoteScope(queryClient, repoPath),
  });
}
