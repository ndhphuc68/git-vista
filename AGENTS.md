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
