//! Generates `src/ipc/bindings.generated.ts` from the Rust command surface.
//!
//! This runs as a test rather than from `build.rs` so the TypeScript build never
//! depends on a Rust toolchain: the generated file is committed, and
//! `pnpm check-bindings` fails CI if regenerating it produces a diff.

use std::path::{Path, PathBuf};

use specta_typescript::{semantic::Configuration, Typescript};

/// Commands registered in `create_specta_builder`. Kept here so a command that
/// silently drops out of the builder fails this test instead of quietly
/// disappearing from the bindings.
const EXPECTED_COMMAND_COUNT: usize = 77;

fn output_path() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri has a parent directory")
        .join("src/ipc/bindings.generated.ts")
}

#[test]
fn export_typescript_bindings() {
    let path = output_path();

    visual_git_lib::create_specta_builder()
        // Timestamps, counts and indices are i64/usize in Rust. They are all far
        // below 2^53, and the TypeScript side has always treated them as `number`.
        .dangerously_cast_bigints_to_number()
        // Without this, every f64 exports as `number | null`, because JSON cannot
        // carry NaN or Infinity. These fields are timestamps that are never NaN,
        // so the null would be noise: it would force null checks at call sites
        // over a case that cannot occur, and hide the fields that are genuinely
        // Option<...> in Rust.
        .semantic_types(Configuration::default().enable_lossless_floats())
        .export(Typescript::default(), &path)
        .expect("export bindings");

    let generated = std::fs::read_to_string(&path).expect("read generated bindings");

    // Count the call sites, not the import that binds the name. `ping` is written
    // `__TAURI_INVOKE<string>(...)` because it is the only command that does not
    // return a Result, so match on the name followed by either `(` or `<`.
    let command_count = generated
        .lines()
        .filter(|line| line.contains("__TAURI_INVOKE(") || line.contains("__TAURI_INVOKE<"))
        .count();
    assert_eq!(
        command_count, EXPECTED_COMMAND_COUNT,
        "expected {EXPECTED_COMMAND_COUNT} commands in the generated bindings, found \
         {command_count}. Update EXPECTED_COMMAND_COUNT when adding or removing a command."
    );
}
