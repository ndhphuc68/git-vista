/**
 * Stash fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { StashItem } from "../bindings.generated";

let mockStashes: StashItem[] = [
  {
    index: 0,
    message: "WIP on main: initial work",
    commit_id: "stash1234567890",
    created_at: Math.floor(Date.now() / 1000) - 3600,
  },
];

export function getMockStashes(): StashItem[] {
  return mockStashes;
}

export function setMockStashes(value: StashItem[]): void {
  mockStashes = value;
}
