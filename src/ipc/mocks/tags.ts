/**
 * Tag fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { TagItem } from "../bindings.generated";

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

export function getMockTags(): TagItem[] {
  return mockTags;
}

export function setMockTags(value: TagItem[]): void {
  mockTags = value;
}

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
