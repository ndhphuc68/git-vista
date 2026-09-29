import React from "react";
import { usePullRequestDetailDrawer } from "./usePullRequestDetailDrawer";
import { PullRequestDrawerHeader } from "./PullRequestDrawerHeader";
import { PullRequestActionToolbar } from "./PullRequestActionToolbar";
import { PullRequestTitleAuthor } from "./PullRequestTitleAuthor";
import { PullRequestLabels } from "./PullRequestLabels";
import { PullRequestCiChecks } from "./PullRequestCiChecks";
import { PullRequestDescription } from "./PullRequestDescription";
import { PullRequestChangedFiles } from "./PullRequestChangedFiles";

interface PullRequestDetailDrawerProps {
  repoPath: string;
}

export const PullRequestDetailDrawer: React.FC<PullRequestDetailDrawerProps> = ({ repoPath }) => {
  const m = usePullRequestDetailDrawer(repoPath);

  if (!m.isDrawerOpen || !m.pr) return null;
  const pr = m.pr;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="pr-drawer-backdrop"
        onClick={m.closeDrawer}
        className="fixed inset-0 modal-backdrop z-40 animate-fade-in"
      />

      {/* Slide-over Drawer */}
      <div
        data-testid="pull-request-detail-drawer"
        className="fixed top-0 right-0 bottom-0 z-50 bg-surface border-l border-border-subtle shadow-2xl transition-transform duration-300 ease-macos flex flex-col overflow-hidden animate-slide-up w-[520px] max-w-[90vw]"
      >
        <PullRequestDrawerHeader
          pr={pr}
          onCopyLink={m.handleCopyLink}
          onClose={m.closeDrawer}
          t={m.t}
        />

        <PullRequestActionToolbar
          pr={pr}
          isCheckingOut={m.isCheckingOut}
          onCheckout={m.handleCheckout}
          t={m.t}
        />

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <PullRequestTitleAuthor pr={pr} />

          <PullRequestLabels labels={pr.labels} />

          {m.detail && <PullRequestCiChecks checkRuns={m.detail.check_runs} t={m.t} />}

          <PullRequestDescription body={m.detail?.body} t={m.t} />

          {m.detail && <PullRequestChangedFiles files={m.detail.files} t={m.t} />}
        </div>
      </div>
    </>
  );
};
