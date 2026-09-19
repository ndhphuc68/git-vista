fn main() {
    // Tauri embeds a Common-Controls v6 manifest into the application executable,
    // but not into test binaries. Any binary that links the Tauri runtime — which
    // includes the bindings export test, because `tauri_specta::Builder` pulls it
    // in — then depends on comctl32.dll resolving to v6. Without the manifest it
    // resolves to v5, an entrypoint is missing, and the binary fails to start with
    // exit code 0xc0000139 (STATUS_ENTRYPOINT_NOT_FOUND) printing nothing at all.
    //
    // The path must be absolute: these flags reach dependency crates too, and a
    // relative path would be resolved against each crate's own directory.
    // `rustc-link-arg-tests` scopes this to test binaries, leaving the application
    // executable to the manifest Tauri already gives it.
    #[cfg(windows)]
    {
        let manifest =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("common-controls.manifest");
        println!("cargo:rerun-if-changed=common-controls.manifest");
        println!("cargo:rustc-link-arg-tests=/MANIFEST:EMBED");
        println!(
            "cargo:rustc-link-arg-tests=/MANIFESTINPUT:{}",
            manifest.display()
        );
    }

    tauri_build::build()
}
