import React, { useMemo } from "react";
import type { RebasePlanStep, RebaseCommitItem } from "../../ipc/bindings.generated";
import { projectRebasePlan } from "./rebaseProjection";
import { RebaseLivePreviewSummary } from "./RebaseLivePreviewSummary";
import { RebaseLivePreviewTimeline } from "./RebaseLivePreviewTimeline";
import { RebaseLivePreviewDropped } from "./RebaseLivePreviewDropped";

export interface RebaseLivePreviewProps {
  baseCommitId: string;
  baseCommitSummary?: string;
  steps: RebasePlanStep[];
  commitMap: Map<string, RebaseCommitItem>;
}

export const RebaseLivePreview: React.FC<RebaseLivePreviewProps> = ({
  baseCommitId,
  baseCommitSummary,
  steps,
  commitMap,
}) => {
  const { projectedCommits, droppedCommits, squashedCount, rewordedCount } = useMemo(
    () => projectRebasePlan(steps, commitMap),
    [steps, commitMap]
  );

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <RebaseLivePreviewSummary
        resultingCount={projectedCommits.length}
        rewordedCount={rewordedCount}
        squashedCount={squashedCount}
        droppedCount={droppedCommits.length}
      />

      <RebaseLivePreviewTimeline
        baseCommitId={baseCommitId}
        baseCommitSummary={baseCommitSummary}
        projectedCommits={projectedCommits}
      />

      <RebaseLivePreviewDropped droppedCommits={droppedCommits} />
    </div>
  );
};
