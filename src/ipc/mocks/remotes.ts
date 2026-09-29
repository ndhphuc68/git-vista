/**
 * Remote fixtures for browser dev mode. See `../mocks.ts` for context.
 */
import type { RemoteItem } from "../bindings.generated";

let mockRemotes: RemoteItem[] = [
  {
    name: "origin",
    fetch_url: "https://github.com/gitvista/git-vista.git",
    push_url: "https://github.com/gitvista/git-vista.git",
    branch_count: 5,
    is_default: true,
  },
];

export function getMockRemotes(): RemoteItem[] {
  return mockRemotes;
}

export function setMockRemotes(value: RemoteItem[]): void {
  mockRemotes = value;
}

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
