import type { QueryClient } from "@tanstack/react-query";
import { qk } from "../../../domain/queryKeys";
import type { GraphDialog } from "../model/graphDialog";
import type { GraphDialogComponents } from "./CommitGraphDialogs";
import type { RepoSummary } from "../../../ipc/bindings.generated";

interface CommitGraphShellDialogsProps extends GraphDialogComponents {
  dialog: GraphDialog;
  onClose: () => void;
  currentRepo: RepoSummary;
  queryClient: QueryClient;
}

/** Create Tag / Create Branch dialogs, owned by the tag/branch features but shown from here. */
export function CommitGraphShellDialogs({
  dialog,
  onClose,
  currentRepo,
  queryClient,
  CreateTagModal,
  CreateBranchModal,
}: CommitGraphShellDialogsProps) {
  return (
    <>
      {dialog.type === "createTag" && (
        <CreateTagModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          targetCommitId={dialog.commit.id}
          targetCommitSummary={dialog.commit.summary}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.tags(currentRepo.path) });
          }}
        />
      )}

      {dialog.type === "createBranch" && (
        <CreateBranchModal
          isOpen={true}
          onClose={() => onClose()}
          repoPath={currentRepo.path}
          targetCommit={dialog.commit.id}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: qk.commitGraph(currentRepo.path) });
            queryClient.invalidateQueries({ queryKey: qk.branches(currentRepo.path) });
          }}
        />
      )}
    </>
  );
}
