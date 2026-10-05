/**
 * Constants for string values compared across the app.
 *
 * Uses `as const` instead of a TypeScript `enum`: an enum generates runtime
 * code, whereas `as const` is plain data and infers a more precise type.
 *
 * - git.ts: values produced by the Rust backend
 * - github.ts: values produced by the GitHub API
 * - app.ts: frontend-only values
 */
export * from "./git";
export * from "./github";
export * from "./app";
