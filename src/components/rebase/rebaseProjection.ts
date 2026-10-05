import type { RebasePlanStep, RebaseCommitItem } from "../../ipc/bindings.generated";
import { REBASE_ACTION } from "../../domain/enums";

export interface ProjectedCommit {
  id: string;
  short_id: string;
  displayMessage: string;
  author_name: string;
  isReworded: boolean;
  isSquashed: boolean;
  squashedSubCommits: Array<{ short_id: string; summary: string }>;
}

export interface RebaseProjection {
  projectedCommits: ProjectedCommit[];
  droppedCommits: Array<{ short_id: string; summary: string }>;
  squashedCount: number;
  rewordedCount: number;
}

function resolveStepDisplay(commit: RebaseCommitItem | undefined, stepCommitId: string) {
  return {
    shortId: commit ? commit.short_id : stepCommitId.slice(0, 7),
    originalSummary: commit ? commit.summary : stepCommitId.slice(0, 7),
    author: commit ? commit.author_name : "Author",
  };
}

function applySquashStep(
  projected: ProjectedCommit[],
  step: RebasePlanStep,
  shortId: string,
  originalSummary: string
) {
  if (projected.length === 0) return;
  const target = projected[projected.length - 1]!;
  target.isSquashed = true;
  target.squashedSubCommits.push({ short_id: shortId, summary: originalSummary });
  if (step.action === REBASE_ACTION.SQUASH && step.new_message) {
    target.displayMessage = step.new_message.split("\n")[0] || target.displayMessage;
  }
}

function buildProjectedCommit(
  step: RebasePlanStep,
  shortId: string,
  originalSummary: string,
  author: string
): ProjectedCommit {
  const isReword = step.action === REBASE_ACTION.REWORD;
  const displayMessage =
    isReword && step.new_message
      ? step.new_message.split("\n")[0] || originalSummary
      : originalSummary;

  return {
    id: step.commit_id,
    short_id: shortId,
    displayMessage,
    author_name: author,
    isReworded: isReword,
    isSquashed: false,
    squashedSubCommits: [],
  };
}

// Exported for unit testing only.
export function projectRebasePlan(
  steps: RebasePlanStep[],
  commitMap: Map<string, RebaseCommitItem>
): RebaseProjection {
  const projected: ProjectedCommit[] = [];
  const dropped: Array<{ short_id: string; summary: string }> = [];
  let sqCount = 0;
  let rwCount = 0;

  for (const step of steps) {
    const commit = commitMap.get(step.commit_id);
    const { shortId, originalSummary, author } = resolveStepDisplay(commit, step.commit_id);

    if (step.action === REBASE_ACTION.DROP) {
      dropped.push({ short_id: shortId, summary: originalSummary });
      continue;
    }

    if (step.action === REBASE_ACTION.SQUASH || step.action === REBASE_ACTION.FIXUP) {
      sqCount++;
      applySquashStep(projected, step, shortId, originalSummary);
      continue;
    }

    if (step.action === REBASE_ACTION.REWORD) {
      rwCount++;
    }

    projected.push(buildProjectedCommit(step, shortId, originalSummary, author));
  }

  return {
    projectedCommits: projected,
    droppedCommits: dropped,
    squashedCount: sqCount,
    rewordedCount: rwCount,
  };
}
