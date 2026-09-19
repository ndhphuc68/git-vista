/**
 * Fixture data for browser dev mode.
 *
 * `invokeCommand` falls back to these whenever it runs outside the Tauri
 * runtime, so `pnpm dev` works in a plain browser with no Rust backend. The
 * state is mutable because the mocked commands write to it — creating a tag in
 * the browser has to be visible to the next `getTags` call.
 *
 * Kept out of `client.ts` so the IPC layer reads as the IPC layer. Behaviour is
 * unchanged from when this lived there.
 */
import type {
  TagItem,
  RemoteItem,
  RebaseCommitItem,
  StashItem,
  GitConfigDto,
  CompareSummary,
} from "./bindings.generated";

let mockTags: TagItem[] = [
  {
    name: "v1.0.0",
    target_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    short_commit_id: "c1a2b3c",
    commit_summary: "Initial release",
    is_annotated: true,
    message: "First official release",
    tagger_name: "GitVista User",
    tagger_email: "user@gitvista.dev",
    timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    name: "v0.9.0",
    target_commit_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    short_commit_id: "a1b2c3d",
    commit_summary: "Beta testing release",
    is_annotated: false,
    message: null,
    tagger_name: null,
    tagger_email: null,
    timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 15,
  },
];

export function resetMockTags() {
  mockTags = [
    {
      name: "v1.0.0",
      target_commit_id: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
      short_commit_id: "c1a2b3c",
      commit_summary: "Initial release",
      is_annotated: true,
      message: "First official release",
      tagger_name: "GitVista User",
      tagger_email: "user@gitvista.dev",
      timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 5,
    },
    {
      name: "v0.9.0",
      target_commit_id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_commit_id: "a1b2c3d",
      commit_summary: "Beta testing release",
      is_annotated: false,
      message: null,
      tagger_name: null,
      tagger_email: null,
      timestamp_sec: Math.floor(Date.now() / 1000) - 86400 * 15,
    },
  ];
}

let mockRemotes: RemoteItem[] = [
  {
    name: "origin",
    fetch_url: "https://github.com/gitvista/git-vista.git",
    push_url: "https://github.com/gitvista/git-vista.git",
    branch_count: 5,
    is_default: true,
  },
];

export function resetMockRemotes() {
  mockRemotes = [
    {
      name: "origin",
      fetch_url: "https://github.com/gitvista/git-vista.git",
      push_url: "https://github.com/gitvista/git-vista.git",
      branch_count: 5,
      is_default: true,
    },
  ];
}

let mockRebaseCommits: RebaseCommitItem[] = [
  {
    id: "a1b2c3d4e5f67890123456789012345678901234",
    short_id: "a1b2c3d",
    summary: "feat: add user authentication",
    message: "feat: add user authentication\n\nImplements JWT login",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    parent_ids: ["0000000000000000000000000000000000000000"],
  },
  {
    id: "b2c3d4e5f6789012345678901234567890123456",
    short_id: "b2c3d4e",
    summary: "fix: resolve token expiry bug",
    message: "fix: resolve token expiry bug",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    parent_ids: ["a1b2c3d4e5f67890123456789012345678901234"],
  },
  {
    id: "c3d4e5f678901234567890123456789012345678",
    short_id: "c3d4e5f",
    summary: "docs: update API readme",
    message: "docs: update API readme",
    author_name: "Developer",
    author_email: "dev@example.com",
    timestamp: Math.floor(Date.now() / 1000) - 600,
    parent_ids: ["b2c3d4e5f6789012345678901234567890123456"],
  },
];

export function resetMockRebaseCommits() {
  mockRebaseCommits = [
    {
      id: "a1b2c3d4e5f67890123456789012345678901234",
      short_id: "a1b2c3d",
      summary: "feat: add user authentication",
      message: "feat: add user authentication\n\nImplements JWT login",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      parent_ids: ["0000000000000000000000000000000000000000"],
    },
    {
      id: "b2c3d4e5f6789012345678901234567890123456",
      short_id: "b2c3d4e",
      summary: "fix: resolve token expiry bug",
      message: "fix: resolve token expiry bug",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      parent_ids: ["a1b2c3d4e5f67890123456789012345678901234"],
    },
    {
      id: "c3d4e5f678901234567890123456789012345678",
      short_id: "c3d4e5f",
      summary: "docs: update API readme",
      message: "docs: update API readme",
      author_name: "Developer",
      author_email: "dev@example.com",
      timestamp: Math.floor(Date.now() / 1000) - 600,
      parent_ids: ["b2c3d4e5f6789012345678901234567890123456"],
    },
  ];
}

let mockStashes: StashItem[] = [
  {
    index: 0,
    message: "WIP on main: initial work",
    commit_id: "stash1234567890",
    created_at: Math.floor(Date.now() / 1000) - 3600,
  },
];

let mockGlobalConfig: GitConfigDto = {
  userName: "GitVista User",
  userNameSource: "global",
  userEmail: "user@gitvista.dev",
  userEmailSource: "global",
  defaultBranch: "main",
  pullRebase: false,
  gpgSign: false,
  gpgKey: "",
  fetchPrune: false,
  rebaseAutostash: false,
};

let mockLocalConfigs: Record<string, Partial<GitConfigDto>> = {};

export function resetMockGitConfig() {
  mockGlobalConfig = {
    userName: "GitVista User",
    userNameSource: "global",
    userEmail: "user@gitvista.dev",
    userEmailSource: "global",
    defaultBranch: "main",
    pullRebase: false,
    gpgSign: false,
    gpgKey: "",
    fetchPrune: false,
    rebaseAutostash: false,
  };
  mockLocalConfigs = {};
}

let mockCompareSummary: CompareSummary = {
  base_rev: "main",
  target_rev: "feature/auth",
  resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  mode: "MergeBase",
  ahead_count: 2,
  behind_count: 0,
  commits: [
    {
      id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_id: "a1b2c3d",
      summary: "feat: implement user authentication flow",
      author_name: "GitVista User",
      author_email: "user@gitvista.dev",
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      parent_ids: ["b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"],
    },
    {
      id: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
      short_id: "b2c3d4e",
      summary: "chore: setup oauth config",
      author_name: "GitVista User",
      author_email: "user@gitvista.dev",
      timestamp: Math.floor(Date.now() / 1000) - 7200,
      parent_ids: ["c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
    },
  ],
  files: [
    {
      path: "src/auth.ts",
      old_path: null,
      status: "Modified",
      additions: 45,
      deletions: 12,
      is_binary: false,
    },
    {
      path: "src/config.ts",
      old_path: null,
      status: "Added",
      additions: 20,
      deletions: 0,
      is_binary: false,
    },
  ],
  total_additions: 65,
  total_deletions: 12,
};

export function resetMockCompareData() {
  mockCompareSummary = {
    base_rev: "main",
    target_rev: "feature/auth",
    resolved_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    resolved_target_oid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    effective_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    merge_base_oid: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    mode: "MergeBase",
    ahead_count: 2,
    behind_count: 0,
    commits: [
      {
        id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        short_id: "a1b2c3d",
        summary: "feat: implement user authentication flow",
        author_name: "GitVista User",
        author_email: "user@gitvista.dev",
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        parent_ids: ["b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"],
      },
      {
        id: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
        short_id: "b2c3d4e",
        summary: "chore: setup oauth config",
        author_name: "GitVista User",
        author_email: "user@gitvista.dev",
        timestamp: Math.floor(Date.now() / 1000) - 7200,
        parent_ids: ["c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"],
      },
    ],
    files: [
      {
        path: "src/auth.ts",
        old_path: null,
        status: "Modified",
        additions: 45,
        deletions: 12,
        is_binary: false,
      },
      {
        path: "src/config.ts",
        old_path: null,
        status: "Added",
        additions: 20,
        deletions: 0,
        is_binary: false,
      },
    ],
    total_additions: 65,
    total_deletions: 12,
  };
}

/**
 * Mutable handle on the fixtures above.
 *
 * The mocked commands reassign whole collections (`mockTags = [...]`), which an
 * imported binding cannot do from another module, so the reassignment stays
 * here behind accessors.
 */
export const mockState = {
  get tags() {
    return mockTags;
  },
  set tags(value: TagItem[]) {
    mockTags = value;
  },
  get remotes() {
    return mockRemotes;
  },
  set remotes(value: RemoteItem[]) {
    mockRemotes = value;
  },
  get rebaseCommits() {
    return mockRebaseCommits;
  },
  get stashes() {
    return mockStashes;
  },
  set stashes(value: StashItem[]) {
    mockStashes = value;
  },
  get globalConfig() {
    return mockGlobalConfig;
  },
  get localConfigs() {
    return mockLocalConfigs;
  },
  get compareSummary() {
    return mockCompareSummary;
  },
};
