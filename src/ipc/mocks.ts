/**
 * Fixture data for browser dev mode.
 *
 * `invokeCommand` falls back to these whenever it runs outside the Tauri
 * runtime, so `pnpm dev` works in a plain browser with no Rust backend. The
 * state is mutable because the mocked commands write to it — creating a tag in
 * the browser has to be visible to the next `getTags` call.
 *
 * Split by domain into `./mocks/*.ts`; this file re-exports the same names so
 * `src/ipc/client.ts` and the domain modules keep working unchanged.
 */
import { getMockTags, setMockTags, resetMockTags } from "./mocks/tags";
import { getMockRemotes, setMockRemotes, resetMockRemotes } from "./mocks/remotes";
import { getMockRebaseCommits, resetMockRebaseCommits } from "./mocks/rebase";
import { getMockStashes, setMockStashes } from "./mocks/stashes";
import { getMockGlobalConfig, getMockLocalConfigs, resetMockGitConfig } from "./mocks/gitConfig";
import { getMockCompareSummary, resetMockCompareData } from "./mocks/compare";

export { resetMockTags, resetMockRemotes, resetMockRebaseCommits, resetMockGitConfig, resetMockCompareData };

/**
 * Mutable handle on the fixtures above.
 *
 * The mocked commands reassign whole collections (`mockState.tags = [...]`),
 * which an imported binding cannot do from another module, so each domain
 * module keeps its own reassignable variable behind get/set accessors here.
 */
export const mockState = {
  get tags() {
    return getMockTags();
  },
  set tags(value) {
    setMockTags(value);
  },
  get remotes() {
    return getMockRemotes();
  },
  set remotes(value) {
    setMockRemotes(value);
  },
  get rebaseCommits() {
    return getMockRebaseCommits();
  },
  get stashes() {
    return getMockStashes();
  },
  set stashes(value) {
    setMockStashes(value);
  },
  get globalConfig() {
    return getMockGlobalConfig();
  },
  get localConfigs() {
    return getMockLocalConfigs();
  },
  get compareSummary() {
    return getMockCompareSummary();
  },
};
