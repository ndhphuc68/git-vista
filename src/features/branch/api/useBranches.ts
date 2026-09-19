import { useQuery } from "@tanstack/react-query";
import { invokeCommand } from "../../../ipc/client";
import { qk } from "../../../domain/queryKeys";

/** Local and remote branches of a repository. */
export function useBranches(repoPath: string) {
	return useQuery({
		queryKey: qk.branches(repoPath),
		queryFn: () => invokeCommand.getBranches(repoPath),
		enabled: Boolean(repoPath),
	});
}
