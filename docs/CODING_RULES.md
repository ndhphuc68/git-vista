# Coding rules

These rules keep the architecture that the refactor (phases 0–7c) put in
place. Each one exists because breaking it caused a real bug or real debt —
see `docs/superpowers/REFACTOR_STATUS.md` for the history behind them.

Rules marked **[enforced]** are checked by a tool; breaking them turns
`pnpm check` red. The rest are conventions that reviewers must check by hand.

---

## 1. Before and after every change

Run the baseline before writing code and again before calling a task done:

```bash
pnpm lint                     # exit 0, 0 warnings
pnpm build                    # exit 0
pnpm test                     # all green
pnpm check-query-keys
pnpm check-comment-language
pnpm check-lint-suppressions
pnpm check-bindings           # only needed when Rust commands change
cargo test --manifest-path src-tauri/Cargo.toml   # when src-tauri/ changes
```

- If the baseline is red **before** you start, stop and find out why. Do not
  build on top of a red tree.
- The working tree must be clean (everything committed) when you report a
  task as done. A commit that only builds with uncommitted files in the tree
  is a broken commit.

---

## 2. Layers and imports

```
src/
├─ domain/        queryKeys, enums, constants — depends on nothing
├─ shared/        ui/ (Modal, Button, Alert), hooks/, utils/ — depends on domain only
├─ ipc/           generated bindings + hand-written command wrappers + mocks
├─ features/<n>/  one business slice each (see section 3)
└─ components/, hooks/, store/, App.tsx — the app shell that composes features
```

1. **Dependencies only point down: `features → shared → domain`.** [enforced:
   `architectureBoundaries.test.ts`]
2. **Only `src/ipc/**` and `src/features/*/api/**` may import `ipc/` at
   runtime.** Components, hooks, and stores call through `features/*/api`.
   `import type` from `ipc/` is allowed everywhere. [enforced:
   `no-restricted-imports` + boundary test over all of `src/`]
3. **`shared/ui/**` must not import `ipc/`, `store/`, or `i18n/`.** It gets
   everything, translated labels included, through props. [enforced]
4. **A feature imports another feature only through that feature's
   `index.ts`.** Never reach into `features/x/api/`, `components/`, or
   `model/` from outside `x`, and never write `features/x/index`
   explicitly. [enforced]
5. **No import cycles.** Feature-to-feature public imports must not form a
   cycle, and no module cycle may pass through a `features/*/index.ts`.
   [enforced]
   - Inside a feature, import siblings directly (`../api`), **never** your
     own feature's `index.ts`. Importing your own index is the usual way a
     cycle appears.
   - A component that lives outside the feature but imports from it, and is
     also re-exported by it, creates a cycle. Move the component into
     `features/<n>/components/` instead.
6. **Do not add exceptions to make a guard green.** An exception records a
   real dependency that cannot be removed yet, with a name, a reason, and a
   removal condition. If a file does not actually break the rule but still
   gets flagged, the guard has a bug: fix the guard and add a regression test
   for it. `CROSS_FEATURE_EXCEPTIONS` was deleted on purpose. Do not bring it
   back.

---

## 3. Feature structure

```
features/<name>/
├─ api/          React Query hooks that wrap ipc/<domain>. The only place in the feature that imports ipc/.
├─ components/   UI. Knows nothing about IPC or query keys.
├─ hooks/        (optional) UI state and orchestration hooks.
├─ model/        (optional) pure logic: tree building, state unions, transforms.
└─ index.ts      The only public entry. Export only what callers outside actually use.
```

- Even when a feature needs only one IPC call, add a thin `api/` wrapper. Do
  not let `hooks/` or `components/` call `invokeCommand`.
- Remove exports from `index.ts` once nothing outside the feature uses them.
- **Cross-feature UI goes through props, not imports.** When feature A has to
  open a dialog that belongs to feature B, A keeps the decision of *when* to
  open it (state and conditions stay in A). The shell (`Shell.tsx`, not a
  feature) supplies *what* to render and passes the state in through props or
  render callbacks.

---

## 4. Data, cache, and IPC

1. **No query key literals.** Always build keys with `qk` from
   `src/domain/queryKeys.ts`. If a key is missing, add it there. [enforced:
   `check-query-keys`]
2. **Every parameter that changes the result must be part of the key.** For
   example, `ignoreWhitespace` is part of the diff key. Removing a parameter
   from a key needs proof that it is safe, which can mean tracing the value
   down to the Rust source.
3. **Mutation hooks own invalidation.** A mutation hook in `api/` invalidates
   `qk.repo.all(repoPath)` (or a narrower key) in `onSuccess`. Call sites do
   not pass `onSuccess` just to invalidate. If you find yourself calling
   `invalidateQueries` inside a component, that logic belongs in `api/`.
   Test both directions: success invalidates, failure does not.
4. **Never call `invalidateQueries()` without a key.** It clears the cache of
   every repo in every tab. The one existing call has a comment explaining
   why.
5. **Do not override React Query defaults with `undefined`.** Writing
   `staleTime: options?.staleTime` replaces the global 60s default with
   `undefined` when the caller passes nothing. Spread the option only when it
   is defined.
6. **`src/ipc/bindings.generated.ts` is generated. Never edit it by hand.**
   Change the Rust command, regenerate, and keep `pnpm check-bindings` green.
   Types for GitHub REST payloads, which have no Rust counterpart, live in
   hand-written files.
7. **When a generated type breaks the build, fix the code, not the type.**
   Each such type error has turned out to be a place where the TypeScript
   code was wrong about the data Rust sends. Do not cast it away.
8. **The IPC facade is assembled by spreading domain objects, so its key
   count is pinned by a test** (`ipcFacade.test.ts`). When you add a
   command, update that test. A missing spread still builds.
9. **A green `pnpm build` proves the types match, not that IPC works.**
   Tests run against mocks. Any change to argument names or payload shapes
   must also be checked in the real Tauri app.

---

## 5. Size and complexity limits

All of these are at `error` level in `.oxlintrc.json`. [enforced]

| Rule | Limit |
| --- | --- |
| `max-lines` (per file, blanks/comments skipped) | 300 |
| `max-lines-per-function` | 80 |
| `complexity` | 15 |
| `max-depth` | 4 |
| `max-params` | 5 |
| `max-nested-callbacks` | 3 |

- **Do not raise the limits and do not add per-file disables.** The team
  decided to keep 80/15/300 and clean up to zero (phase 7c). Test files,
  `src/i18n/{en,vi}.ts`, and `max-params` in `src/ipc/**` are the only
  exemptions, and all of them are already in the config.
- **Split by responsibility, not to hit a line count.** Patterns in use:
  - A hook's heavy body moves to `<hook>.actions.ts` (or `.load.ts` for data
    loading effects) as `create<Name>Handler(context)`, where `context` is a
    plain object of state, setters, and dependencies.
  - Pure logic moves to `model/` or a sibling helper module.
  - A hook's return object is passed down as one typed prop
    (`view`/`data`/`actions`), not as a spread of individual fields.
  - More than 5 parameters: group them into an options object.
- **Do not move an effect that reads a ref or setter into its own custom
  hook.** `react/exhaustive-deps` cannot prove stability across that
  boundary. Extract only the pure part and keep the effect where it is.
- **Do not add new `eslint-disable` / `oxlint-disable` comments.** Fix the
  code instead. Three suppressions already exist in mutation hook tests;
  treat them as debt, not as a pattern to copy.
  [enforced: `pnpm check-lint-suppressions` holds a per-file baseline in
  `scripts/lintSuppressions.mjs` that can only shrink, and `pnpm lint` fails
  on a suppression that no longer suppresses anything]

---

## 6. Other lint rules [enforced]

- No `any` (`typescript/no-explicit-any`). Type `catch (err)` as `unknown`
  and read it with `messageOf` / `toErrorMessage` from
  `src/shared/utils/toError.ts`.
- `no-console`, except `console.warn` / `console.error`. Scripts in
  `scripts/` are exempt.
- `react/exhaustive-deps` and `react/rules-of-hooks`. Fix dependencies; do
  not silence them.
- `react/only-export-components`: a `.tsx` file exports components only
  (constants allowed). Put helpers in a `.ts` file.
- `typescript/consistent-type-imports` with inline `type` imports, and
  `import/no-duplicates`.
- Unused variables fail the build. Prefix intentionally unused args with `_`.
- `eqeqeq`: use `===` / `!==`.
- `typescript/switch-exhaustiveness-check`: a `switch` over a union names
  every member (`case null:` included). A `default` does not count, so adding
  a member to the union points at every `switch` that must handle it.
- `typescript/no-unsafe-assignment` and `typescript/no-unsafe-member-access`:
  never let `any` flow in. Read fetch bodies with `readJson<RawShape>(res)`
  from `src/services/readJson.ts` and keep the runtime guards (`Array.isArray`,
  `typeof`). Parse stored JSON into `unknown` and narrow it with a tested
  parser (see `parseTabSession`). Off in tests (Vitest matchers return `any`)
  and in untyped `scripts/**` / `website/**`.
- `react/no-array-index-key`: key list items by identity (SHA, path,
  `ref_type:name`). For diffs use `hunkKey`, `diffLineKey`, and
  `withOffsetKeys` from `src/shared/utils/listKeys.ts`.

---

## 7. Reuse what exists

Before writing new UI or helpers, check these:

| Need | Use |
| --- | --- |
| Dialog | `Modal` (compound) from `src/shared/ui`. Use `stacked` for nested modals and `size="full"` for viewport-sized ones. Mark the main input with `data-autofocus`. |
| Buttons, inline errors | `Button`, `Alert` from `src/shared/ui` |
| Escape key | `useEscapeKey` (module registry: only the top-most instance reacts). Do not add `window` keydown listeners for Escape. |
| Focus trap | `useFocusTrap` (already inside `Modal`) |
| Copy to clipboard | `useCopyToClipboard` |
| Short SHA, error text | `shortSha()`, `toErrorMessage()`, `messageOf()` in `src/shared/utils` |
| Magic numbers | `src/domain/constants/{ui,motion,zIndex}.ts`. No `z-[9999]`, no bare `setTimeout(..., 2000)`, no `substring(0, 7)`. |
| String unions | `src/domain/enums.ts` |
| Mutually exclusive dialogs | One discriminated union state (like `SidebarDialog`), not one boolean per dialog |

- **If a primitive is missing something, add it to the primitive** (the way
  `size="full"` and `label` were added to `Modal`). Do not work around it at
  each call site.
- **But do not stuff variant props into a compound component.** A header
  with a subtitle or extra buttons stays hand-built inside `Modal`.
- **Diff two blocks before you merge them.** Two JSX blocks that look the same
  often differ in behavior (a guard, an `aria-label`, filtered vs. unfiltered
  counts). Merging them without a diff changes behavior silently.
- **A sequence of commands is not one mutation.** When a flow calls several
  hooks in order (stash → checkout), the `loading` flag must cover the whole
  chain, not only the last call.

---

## 8. User-facing text and i18n

The app ships in two languages, Vietnamese (`vi`, the default) and English
(`en`). Every string a user can see or hear must go through i18n.

1. **No hardcoded user-facing strings.** This covers JSX text,
   `placeholder`, `aria-label`, `title`, `alt`, toast messages, error
   fallbacks, confirm-dialog text, and command palette labels. Read them from
   the dictionary:
   - In components and hooks: `const { t } = useTranslation()` from
     `src/i18n`.
   - Outside React (stores, `utils/`, `*.actions.ts` factories): accept `t`
     as a parameter, or call `getTranslation()` as `commandRegistry.ts` and
     `errorMapping.ts` do.
2. **Add every key to both `src/i18n/vi.ts` and `src/i18n/en.ts` in the same
   change.** `vi.ts` is the source of the `Translations` type, so a key added
   only to `vi.ts` fails `pnpm build`. Do not satisfy the type by copying the
   Vietnamese text into `en.ts`. Write a real English translation.
3. **Group keys by screen or feature** (`t.branch.*`, `t.diff.*`), following
   the existing nesting. Do not add a flat top-level key for a one-off string.
4. **Do not build sentences by concatenation.** Word order differs between
   languages. Put the whole sentence in the dictionary with named
   placeholders (`"{count} files changed"`) and fill them with
   `.replace("{count}", String(n))`. Use `formatRelativeTime` for relative
   dates.
5. **Simple and advanced mode labels come from `actions`** (returned by
   `useTranslation()`), not from `t.gitActions.simple`/`advanced` directly,
   so the label follows the user's mode.
6. **`shared/ui/**` cannot import `i18n/`** (rule 2.3). It receives
   translated labels through props, and the caller passes `t.…` in.
7. **Tests assert against the dictionary, not a copied literal.** Import
   `vi` from `src/i18n/vi` (or use `getTranslation("vi")`) and assert on
   `viTranslations.x.y`, so a wording change does not break the test.
8. **Text that is not user-facing stays in English and out of i18n:** log
   messages, `console.warn`/`console.error`, thrown developer errors, test
   IDs, and query keys.
9. **Existing debt:** about 40 files outside `src/i18n/` still hardcode
   Vietnamese text (for example `aria-label="Đóng"` in `Modal.tsx`, the help
   diagrams, pull request components, `useToastStore.ts`). Do not add more.
   When you write **new** text in one of these files, use i18n. Moving the
   old strings into the dictionary is a separate change, following rule 10.1
   (mechanical replacement), with a test that pins the rendered text.

---

## 9. Files, naming, and styling

1. **File names follow what the file exports:**

   | File holds | Name |
   | --- | --- |
   | A component | `PascalCase.tsx` (`BranchLeafRow.tsx`) |
   | A hook | `useCamelCase.ts` (`.tsx` only if it returns JSX) |
   | A hook's or component's extracted handlers | `<owner>.actions.ts` (`useSidebarActions.actions.ts`) |
   | A data loading effect body | `<owner>.load.ts` |
   | Pure helpers, no JSX | `camelCase.ts` |

   Use `.actions.ts`, not `.handlers.ts`. Two older files still use
   `.handlers.ts` (`useInteractiveRebase.handlers.ts`,
   `useConflictResolver.handlers.ts`). Do not copy that name. Rename them in
   a separate change, not inside a feature change.
2. **New tests sit next to the module they test** (`Foo.tsx` +
   `Foo.test.tsx`). `src/test/` holds only shared test helpers, app-level
   tests, and the architecture guards. The ~100 existing tests in
   `src/test/` stay where they are until someone moves them on purpose.
3. **New domain UI goes in `features/<name>/`, not `src/components/`.**
   `src/components/` is for the app shell and code not yet migrated.
   - Do not add new imports from `features/**` up into `src/components/**`.
     There are 12 today, for example `CloneModal.tsx` →
     `components/welcome/repoUrl` and `FileDiffViewer.tsx` →
     `components/diff/DiffLineContent`. Code both sides need moves down into
     `shared/`, or into the feature that owns it.
4. **Conditional class names use `clsx`.** Do not build them with template
   literals (`` className={`a ${x ? "b" : ""}`} ``) or string concatenation.
   There are 52 template literal `className`s today. Convert one when you
   touch its line.
5. **Colors come from design tokens** (`docs/DESIGN_SYSTEM.md`: `bg-window`,
   `bg-surface`, `text-primary`, `border-border-subtle`, …). No hex values or
   arbitrary colors such as `bg-[#ebf0f5]` in `className`, `fill`, or
   `stroke`. If no token fits, add one to the design system (light and dark)
   first. Existing offenders: `WindowTabBar.tsx` and `CommitGraphWipRow.tsx`.
   Run `pnpm check-contrast` after changing tokens.

---

## 10. Refactoring and migrating

1. **A migration is a mechanical replacement.** Do not change fetch logic,
   `enabled`, `staleTime`, or behavior along the way. Write down improvements
   you notice; do not make them in the same change.
2. **Pin the behavior before you touch it.** If the code you are about to
   move or split has no direct test, write a characterization test first,
   check that it passes on the original code, and commit it separately.
3. **Count the tests that cover the part you are replacing.** Many tests for
   the business logic do not mean the close button, Escape key, or backdrop
   are covered.
4. **If a split changes the order of effects or hook calls, or moves an early
   return, prove it is equivalent.** Write a test for the observable result
   and run it against both the original file
   (`git show <base>:path > path`, run the test, then `git checkout -- path`)
   and the new one.
5. **Every new pure helper gets its own unit test** in the same change, even
   if component tests already cover it indirectly.
6. **When moving to `Modal`, check what can get lost:** `select()` after
   focus (select once per open, not on every keystroke), fixed heights (put
   them on an inner wrapper; jsdom will not catch this), and guards that
   differ between Escape, backdrop, and the close button.

---

## 11. Tests

1. **Break-test every new test.** Break the implementation on purpose, see
   the test fail, then restore the code. A test that stays green either way
   proves nothing. For example, `not.toThrow()` passes whether cleanup
   happens or not.
2. **Do not weaken an existing assertion to make it pass.** The only
   exception is an assertion that encodes the bug itself. Its replacement
   must be stronger: build the expectation from the source of truth (`qk`,
   `Z_INDEX`) instead of hardcoding it, and keep the same number of checks.
3. **Guards are code and need tests.** When you widen a guard, list every
   syntax form it must catch: side-effect `import "x"`, `export … from`,
   default + named imports, dynamic `import()`, and `import type`. Pin them
   in a table test.
4. **Try a lint rule before relying on it.** oxlint does not have every
   ESLint rule (it has no `no-restricted-syntax`, for example). Check that
   the rule works in a scratch file first; otherwise write a script in
   `scripts/`.
5. **Tests must never touch real user state.** Point config, tokens, and
   environment variables at a temp directory, and block fallback paths too
   (for example `gh auth token`).
6. Unit and component tests go with every change. Do not add or change
   Playwright E2E tests unless the user asks (see `AGENTS.md`).

---

## 12. Rust (`src-tauri/`)

- Emit repo-change events only through `events::emit_repo_changed`. Do not
  write a `"repo-changed"` literal or a local `emit_repo_changed` in
  `src/commands/`. [enforced: `events_test.rs`]
- Commands return `Result<T, AppError>`, not `Result<T, String>`. Do not add
  `map_err(|e| e.to_string())`.
- Register event payloads with `.typ::<T>()`, not `collect_events!`.
- `cargo clippy --all-targets -- -D warnings` and `cargo fmt --check` must
  pass.
- Comments in `.rs` files must be in English too. `check-comment-language`
  does not scan Rust, so reviewers have to check this by hand.

---

## 13. Language and commits

See `AGENTS.md`: code, comments, test names, and commit messages are in
English. User-facing strings live in `src/i18n/vi.ts` and `src/i18n/en.ts`
(see section 8), not in code. Commit messages use Gitmoji with no scope. [enforced for
comments: `check-comment-language`]
