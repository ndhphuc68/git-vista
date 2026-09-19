/**
 * The SINGLE source of truth for React Query query keys.
 *
 * Every key is prefixed with ["repo", repoPath] so invalidation can be
 * scoped: refresh an entire repo with qk.repo.all(path), or just a slice of
 * it with a specific key. Never write a key literal anywhere else.
 */
export const qk = {
  repo: {
    all: (repo: string) => ["repo", repo] as const,
    status: (repo: string) => ["repo", repo, "status"] as const,
    head: (repo: string) => ["repo", repo, "head"] as const,
    state: (repo: string) => ["repo", repo, "state"] as const,
  },

  branches: (repo: string) => ["repo", repo, "branches"] as const,
  tags: (repo: string) => ["repo", repo, "tags"] as const,
  remotes: (repo: string) => ["repo", repo, "remotes"] as const,
  stashes: (repo: string) => ["repo", repo, "stashes"] as const,
  commitGraph: (repo: string) => ["repo", repo, "commitGraph"] as const,

  commitDetails: (repo: string, commitId: string) =>
    ["repo", repo, "commitDetails", commitId] as const,

  /**
   * Diff of a file within a commit. Keyed by the ignore-whitespace option —
   * without this parameter, the two display modes would share one cache
   * slot and show the wrong diff.
   */
  fileDiff: (repo: string, commitId: string, filePath: string, ignoreWhitespace: boolean) =>
    ["repo", repo, "fileDiff", commitId, filePath, ignoreWhitespace] as const,

  fileHistory: (repo: string, filePath: string) => ["repo", repo, "fileHistory", filePath] as const,

  fileBlame: (repo: string, filePath: string, commitId: string) =>
    ["repo", repo, "fileBlame", filePath, commitId] as const,

  /** Diff of a file in the working directory. Keyed by staged state and the ignore-whitespace option. */
  workingFileDiff: (repo: string, filePath: string, isStaged: boolean, ignoreWhitespace: boolean) =>
    ["repo", repo, "workingFileDiff", filePath, isStaged, ignoreWhitespace] as const,

  /** Contents of a file currently conflicted during a merge/rebase. */
  conflictFile: (repo: string, filePath: string) =>
    ["repo", repo, "conflictFile", filePath] as const,

  /** Result of comparing two branches/commits. */
  compareSummary: (repo: string, baseRev: string, targetRev: string, mode: string) =>
    ["repo", repo, "compareSummary", baseRev, targetRev, mode] as const,

  /**
   * Diff of a single file when comparing two branches/commits. Keyed by
   * filePath, mode, and the ignore-whitespace option.
   */
  compareFileDiff: (
    repo: string,
    baseRev: string,
    targetRev: string,
    filePath: string,
    mode: string,
    ignoreWhitespace: boolean
  ) =>
    [
      "repo",
      repo,
      "compareFileDiff",
      baseRev,
      targetRev,
      filePath,
      mode,
      ignoreWhitespace,
    ] as const,

  /** List of commits to be interactively rebased. */
  rebaseCommits: (repo: string, baseCommitId: string) =>
    ["repo", repo, "rebaseCommits", baseCommitId] as const,

  github: {
    repoInfo: (repo: string) => ["repo", repo, "github", "repoInfo"] as const,
    pullRequests: (repo: string, state: string) =>
      ["repo", repo, "github", "pullRequests", state] as const,
    /**
     * Prefix shared by every pull request list, regardless of state filter.
     * Use this when refreshing the list from a call site that doesn't know
     * which state the user is currently filtering by (e.g. after creating a
     * new PR).
     */
    pullRequestsAll: (repo: string) => ["repo", repo, "github", "pullRequests"] as const,
    pullRequestDetail: (repo: string, number: number) =>
      ["repo", repo, "github", "pullRequestDetail", number] as const,
  },

  /** Not tied to any specific repo. */
  recentRepos: () => ["recentRepos"] as const,
  githubToken: () => ["githubToken"] as const,
} as const;
