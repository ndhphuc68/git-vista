/**
 * Interactive rebase fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { RebaseCommitItem } from "../bindings.generated";

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

export function getMockRebaseCommits(): RebaseCommitItem[] {
  return mockRebaseCommits;
}

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
