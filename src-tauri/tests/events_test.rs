use std::path::Path;
use visual_git_lib::events::{repo_changed_payload, REPO_CHANGED_EVENT};

#[test]
fn repo_changed_payload_carries_path_and_reason() {
    let payload = repo_changed_payload("/tmp/repo", "stage_file");
    assert_eq!(payload.repo_path, "/tmp/repo");
    assert_eq!(payload.reason, "stage_file");
    assert!(payload.timestamp_ms > 0.0);
}

// Pins the one shape every emitter shares, matching `RepoChangedPayload` in the
// generated bindings. The frontend reads `payload.repo_path` to scope cache
// invalidation; the old undo_delete_branch/undo_drop_stash emitters sent only
// `path`, which made it fall back to wiping every repo's cache. The old
// interactive-rebase emitter sent `timestamp` instead of `timestamp_ms`.
#[test]
fn repo_changed_payload_serializes_to_the_shape_the_frontend_reads() {
    let json = serde_json::to_value(repo_changed_payload("/tmp/repo", "fetch")).unwrap();
    let mut keys: Vec<&str> = json
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    keys.sort_unstable();
    assert_eq!(keys, ["reason", "repo_path", "timestamp_ms"]);
    assert_eq!(json["repo_path"], "/tmp/repo");
}

#[test]
fn repo_changed_event_name_matches_the_frontend_listener() {
    assert_eq!(REPO_CHANGED_EVENT, "repo-changed");
}

// Guards against a command growing its own emitter again. Nine private copies had
// drifted into two signatures and three payload shapes before they were merged.
#[test]
fn commands_emit_repo_changed_only_through_the_shared_helper() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("src/commands");
    let mut offenders = Vec::new();
    for entry in std::fs::read_dir(&dir).unwrap() {
        let path = entry.unwrap().path();
        let source = std::fs::read_to_string(&path).unwrap();
        if source.contains("\"repo-changed\"") || source.contains("fn emit_repo_changed") {
            offenders.push(path.file_name().unwrap().to_string_lossy().into_owned());
        }
    }
    assert!(
        offenders.is_empty(),
        "use crate::events::emit_repo_changed instead of a local emitter: {offenders:?}"
    );
}
