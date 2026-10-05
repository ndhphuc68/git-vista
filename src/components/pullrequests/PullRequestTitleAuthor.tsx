import React from "react";
import { type GitHubPullRequest } from "../../ipc/githubApi";

interface PullRequestTitleAuthorProps {
  pr: GitHubPullRequest;
}

/** PR title, author avatar/login, and creation date. */
export const PullRequestTitleAuthor: React.FC<PullRequestTitleAuthorProps> = ({ pr }) => (
  <div>
    <h2 className="text-base font-bold text-primary mb-2">{pr.title}</h2>
    <div className="flex items-center gap-2 text-xs text-secondary">
      {pr.user?.avatar_url ? (
        <img src={pr.user.avatar_url} alt={pr.user.login} className="w-5 h-5 rounded-full" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center font-bold text-[10px] text-link">
          {pr.user?.login?.charAt(0).toUpperCase() || "?"}
        </div>
      )}
      <span className="font-semibold text-primary">@{pr.user?.login}</span>
      <span>•</span>
      <span>{new Date(pr.created_at).toLocaleDateString()}</span>
    </div>
  </div>
);
