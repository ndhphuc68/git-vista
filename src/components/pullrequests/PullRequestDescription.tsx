import React from "react";
import { type Translations } from "../../i18n/vi";

interface PullRequestDescriptionProps {
  body: string | undefined;
  t: Translations;
}

/** PR description block, with a placeholder when there is no body text. */
export const PullRequestDescription: React.FC<PullRequestDescriptionProps> = ({ body, t }) => (
  <div className="space-y-1.5">
    <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
      {t.pullRequests.description}
    </h4>
    <div className="p-3.5 bg-surface-header/30 border border-border-subtle rounded-xl text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed min-h-[80px]">
      {body || <span className="text-tertiary italic">{t.pullRequests.noDescription}</span>}
    </div>
  </div>
);
