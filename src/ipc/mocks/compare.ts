/**
 * Compare-summary fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { CompareSummary } from "../bindings.generated";

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

export function getMockCompareSummary(): CompareSummary {
  return mockCompareSummary;
}

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
