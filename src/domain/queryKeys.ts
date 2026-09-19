/**
 * Nguồn chân lý DUY NHẤT cho query key của React Query.
 *
 * Mọi key đều có tiền tố ["repo", repoPath] để invalidate được theo phạm vi:
 * làm mới toàn bộ một repo bằng qk.repo.all(path), hoặc chỉ một phần bằng
 * key cụ thể. Không viết key literal ở bất kỳ đâu khác.
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

  /** Diff của file trong một commit. Phân biệt theo tuỳ chọn bỏ qua khoảng trắng — thiếu tham số này thì hai chế độ hiển thị dùng chung một ô cache. */
  fileDiff: (repo: string, commitId: string, filePath: string, ignoreWhitespace: boolean) =>
    ["repo", repo, "fileDiff", commitId, filePath, ignoreWhitespace] as const,

  fileHistory: (repo: string, filePath: string) => ["repo", repo, "fileHistory", filePath] as const,

  fileBlame: (repo: string, filePath: string, commitId: string) =>
    ["repo", repo, "fileBlame", filePath, commitId] as const,

  /** Diff của file trong thư mục làm việc. Phân biệt staged và tuỳ chọn bỏ qua khoảng trắng. */
  workingFileDiff: (repo: string, filePath: string, isStaged: boolean, ignoreWhitespace: boolean) =>
    ["repo", repo, "workingFileDiff", filePath, isStaged, ignoreWhitespace] as const,

  /** Nội dung file đang xung đột khi merge/rebase. */
  conflictFile: (repo: string, filePath: string) =>
    ["repo", repo, "conflictFile", filePath] as const,

  /** Kết quả so sánh hai nhánh/commit. */
  compareSummary: (repo: string, baseRev: string, targetRev: string, mode: string) =>
    ["repo", repo, "compareSummary", baseRev, targetRev, mode] as const,

  /** Diff của một file khi so sánh hai nhánh/commit. Phân biệt theo filePath, mode và tuỳ chọn bỏ qua khoảng trắng. */
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

  /** Danh sách commit sẽ được rebase tương tác. */
  rebaseCommits: (repo: string, baseCommitId: string) =>
    ["repo", repo, "rebaseCommits", baseCommitId] as const,

  github: {
    repoInfo: (repo: string) => ["repo", repo, "github", "repoInfo"] as const,
    pullRequests: (repo: string, state: string) =>
      ["repo", repo, "github", "pullRequests", state] as const,
    /**
     * Tiền tố của mọi danh sách pull request, không phân biệt bộ lọc trạng thái.
     * Dùng khi cần làm mới danh sách mà nơi gọi không biết người dùng đang lọc
     * theo trạng thái nào (ví dụ sau khi tạo PR mới).
     */
    pullRequestsAll: (repo: string) => ["repo", repo, "github", "pullRequests"] as const,
    pullRequestDetail: (repo: string, number: number) =>
      ["repo", repo, "github", "pullRequestDetail", number] as const,
  },

  /** Không gắn với repo cụ thể. */
  recentRepos: () => ["recentRepos"] as const,
  githubToken: () => ["githubToken"] as const,
} as const;
