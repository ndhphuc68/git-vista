import React from "react";
import { CheckCircle2, ExternalLink, Unlink } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { Button } from "../../../shared/ui";
import { type GitHubUserSummary } from "../../../ipc/githubApi";

export interface GitHubAccountCardProps {
  connectedUser: GitHubUserSummary;
  onDisconnect: () => void;
}

/** Connected-account summary card shown once a GitHub token has been verified. */
export const GitHubAccountCard: React.FC<GitHubAccountCardProps> = ({
  connectedUser,
  onDisconnect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl border border-border-subtle bg-surface-header/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {connectedUser.avatar_url ? (
          <img
            src={connectedUser.avatar_url}
            alt={connectedUser.login}
            className="w-10 h-10 rounded-full border border-border-subtle"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center font-bold text-link">
            {connectedUser.login.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-xs text-secondary flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-diff-add-text" />
            <span>{t.settings.github.connectedAs}</span>
          </div>
          <a
            href={connectedUser.html_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            @{connectedUser.login}
            <ExternalLink size={12} className="text-secondary" />
          </a>
        </div>
      </div>

      <Button variant="danger" onClick={onDisconnect}>
        <Unlink size={13} />
        <span>{t.settings.github.disconnect}</span>
      </Button>
    </div>
  );
};
