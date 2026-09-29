# Phase 5b: Large Module Refactor Design

## Goal

Finish the large-module work that Phase 5 intentionally left incomplete. The work must reduce the responsibility of the remaining oversized React modules without changing product behaviour, IPC contracts, query keys, or cache invalidation scope.

The implementation is divided into independently verifiable slices so the branch remains healthy after every slice.

## Scope

The phase covers these modules, in this order:

1. `features/branch/components/BranchSidebar.tsx`
2. `components/graph/CommitGraph.tsx`
3. `components/diff/CommitDetailPanel.tsx`
4. `components/settings/tabs/GitBehaviorTab.tsx`
5. `components/welcome/WelcomeScreen.tsx`

Existing small modules may move with their owner when that makes an existing seam clearer. This phase does not redesign the UI, alter Rust commands, change IPC payloads, add a new cache-key scheme, or change visible copy.

## Module Boundaries

### Branch

`features/branch` remains the owner of branch selection and branch-dialog decisions. It must no longer implement another domain's IPC interaction inline. Missing tag, stash, merge/rebase, and undo hooks belong to their respective owner modules and retain their current invalidation rules.

The sidebar's interface stays narrow: its callers supply layout placement only, not collections of action callbacks. Dialog state remains a discriminated union, so incompatible dialogs cannot render together.

### History

A new `features/history` module owns the commit graph and commit detail experience. It exposes the graph and detail entry components through its public `index.ts`. Its internal hooks own graph pagination, repository-status lookup, context-menu/dialog state, commit-detail lookup, file filtering, and file navigation.

Pure display transformations, such as branch-pill selection, commit-message parsing, author identity formatting, file-status metadata, and file-path splitting, move into internal model modules. They are independently testable without rendering the UI.

`Shell` imports only the history entry components from the public interface. It continues to own application layout and drawer placement.

### Settings and welcome

`features/settings` owns the Git behaviour tab and its configuration-loading/saving state. `features/welcome` owns repository recents, opening, pin persistence, shortcuts, and drag-and-drop state. Their public interfaces expose only the entry components needed by existing callers.

Internal hooks hide asynchronous command sequencing, local-storage access, and state transitions. Presentational child modules receive only the data and callbacks needed for their portion of the display.

## Data Flow and Failure Behaviour

- Query hooks call the existing `invokeCommand` facade and use the current `qk` factories.
- Mutation success and failure preserve each command's present invalidation and toast/error behaviour.
- Compound actions remain inside the owning module. In particular, stash drop keeps its confirmation, receipt, undo toast, undo command, and stash-list refresh together.
- UI-only state stays local to the hook or entry component that owns the interaction. It is not promoted to `Shell` merely to reduce a line count.
- Repositories, selected commits/files, layout, and settings continue to use their existing stores.

## Slice Plan

1. Complete the missing owner hooks and reduce `BranchSidebar` to composition of branch UI and owner-module interactions.
2. Create `features/history`, extract pure graph and detail models/hooks, then migrate graph and detail entry components through the feature's public interface.
3. Extract Git behaviour loading, persistence, and action orchestration behind a settings hook; split its display into focused modules.
4. Extract welcome repository orchestration, recents filtering/sorting, local persistence, and keyboard/drop handling; split its display into focused modules.
5. Update architectural-boundary tests and the status handover with measured line counts and any deliberately retained exceptions.

Each slice lands separately and leaves imports, tests, and runtime behaviour valid before the next begins.

## Testing and Verification

Every newly extracted hook or model gets focused tests that prove its real behaviour. The tests cover, as relevant:

- query keys, enabled conditions, and invalidation scope;
- discriminated dialog and context-menu transitions;
- file filtering and previous/next file navigation;
- graph pagination and derived graph values;
- configuration and repository-operation failure paths;
- persistence and keyboard/drop interaction transitions.

For each new test, deliberately break the implementation and confirm the test fails before restoring it. Existing component tests remain unchanged unless they encode a defect being corrected. After every slice, run the focused tests; before completion, run `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm check-query-keys`, `pnpm check-comment-language`, and the relevant Rust checks.

## Completion Criteria

- All five target entry modules are below 300 lines, or a measured and documented UI-only exception is explicitly approved in `REFACTOR_STATUS.md`.
- Callers cross feature seams only through each feature's public interface.
- No new IPC or cross-feature exceptions are added; existing exceptions only shrink.
- All preservation and extraction tests pass, as do the full verification commands.
