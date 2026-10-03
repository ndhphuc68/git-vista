# Repository instructions

## Language

**Write all code and commit messages in English.** This covers:

- Code comments — line, block and JSDoc
- Test descriptions — the strings in `describe(...)` and `it(...)`
- Test fixture strings the test invents for itself, e.g. `render(<Button>Save</Button>)`
- Commit messages, including the body
- Identifiers, and any message printed by a script in `scripts/`

**The one exception is user-facing text**, which stays in the language the
product ships in. Leave these alone:

- Entries in `src/i18n/vi.ts` and the Vietnamese half of any i18n fixture
- Strings rendered to users, including `aria-label` and `title` attributes
  (for example `aria-label="Đóng"` in `src/shared/ui/Modal.tsx`)
- A test assertion that must match real translated output

The rule of thumb: if a user could read it in the running app, keep the
product's language. If only a developer reads it, write English.

"Leave these alone" is about language only. New user-facing text must not be
hardcoded at all: it goes into both i18n dictionaries (see "Architecture and
code rules" below).

## Architecture and code rules

Read `docs/CODING_RULES.md` before writing or refactoring code. The hard
rules, most of which fail `pnpm check` when broken:

- Layers point down only: `features → shared → domain`. `shared/ui/**` never
  imports `ipc/`, `store/`, or `i18n/`.
- Only `src/ipc/**` and `src/features/*/api/**` import `ipc/` at runtime.
  Everything else goes through `features/*/api`.
- A feature imports another feature only through that feature's
  `index.ts`; it never imports its own `index.ts`, and imports never form a
  cycle.
- No query key literals; use `qk` from `src/domain/queryKeys.ts`. Mutation
  hooks in `api/` own cache invalidation. Never call `invalidateQueries()`
  without a key.
- Never edit `src/ipc/bindings.generated.ts` by hand.
- Lint limits are fixed: 300 lines/file, 80 lines/function, complexity 15,
  depth 4, 5 params, 3 nested callbacks. Split by responsibility. Do not
  raise the limits, and do not add `eslint-disable`/`oxlint-disable`
  comments or guard exceptions to get green.
- No hardcoded user-facing text (JSX, `aria-label`, `title`, `placeholder`,
  toasts, error fallbacks). Use `useTranslation()` / `getTranslation()` and
  add every key to both `src/i18n/vi.ts` and `src/i18n/en.ts` with a real
  translation. Use placeholders, not string concatenation.
- Put new domain UI in `features/`, new tests next to their module, and
  extracted handlers in `<owner>.actions.ts`. Use `clsx` for conditional
  classes and design tokens for colors (no hex or `bg-[#…]`).
- No hardcoded sizes such as `min-h-[320px]` or `w-[22px]`. Use the Tailwind
  scale (`min-h-80`, `w-5.5`, `w-px`) or a constant in
  `src/domain/constants/ui.ts` for sizes computed at runtime.
- Reuse `Modal`/`Button`/`Alert`/`Input`/`Select`, `useEscapeKey`, `toErrorMessage`, and
  `domain/constants` instead of writing new ones.
- A refactor is a mechanical replacement: pin behavior with a test first and
  do not change logic along the way.

## Testing

For regular feature, bug-fix, or refactoring work, add or update the relevant
unit and component tests as appropriate. Do not add or modify Playwright E2E
tests as part of those coding tasks unless the user explicitly requests it.
Playwright E2E coverage is planned and implemented separately.

## Commit messages

Use Gitmoji for new commit messages: `<emoji> <short description>`.
Use the emoji character directly, without Conventional Commit prefixes such as
`feat:`, `fix:`, or `docs:` (including scoped forms such as `feat(ui):`).
Do not include parenthesized scopes such as `(sidebar)`, `(app)`, or `(m5)`;
place the description directly after the emoji.

Examples:

- `✨ add branch search`
- `🐛 fix commit selection`
- `📝 update design system documentation`
- `♻️ refactor settings state`
- `🎨 improve settings layout`
- `✅ add commit tests`
- `🔧 update build configuration`
