use std::fs;
use std::process::Command;
use visual_git_lib::exec::merge::{
    git_abort_operation, git_continue_operation, git_merge, git_rebase,
};
use visual_git_lib::read::state::get_repo_state;

fn create_repo_with_branch(conflict: bool) -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git")
            .current_dir(p)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {:?} failed: {}",
            args,
            String::from_utf8_lossy(&out.stderr)
        );
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("shared.txt"), "line 1\n").unwrap();
    run(&["add", "shared.txt"]);
    run(&["commit", "-m", "initial commit"]);
    run(&["branch", "-M", "main"]);

    // Tạo nhánh feature
    run(&["checkout", "-b", "feature"]);
    fs::write(
        p.join("shared.txt"),
        if conflict {
            "feature edit\n"
        } else {
            "line 1\nfeature add\n"
        },
    )
    .unwrap();
    run(&["commit", "-am", "feature commit"]);

    // Quay lại main và sửa đổi
    run(&["checkout", "main"]);
    if conflict {
        fs::write(p.join("shared.txt"), "main edit\n").unwrap();
        run(&["commit", "-am", "main commit"]);
    }

    dir
}

#[test]
fn test_merge_fast_forward_success() {
    let dir = create_repo_with_branch(false);
    let res = git_merge(dir.path(), "feature", false).unwrap();
    assert!(res.success);
    let state = get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "clean");
}

#[test]
fn test_merge_conflict_and_abort() {
    let dir = create_repo_with_branch(true);
    let res = git_merge(dir.path(), "feature", false).unwrap();
    assert!(!res.success);
    assert_eq!(res.status, "Conflict");

    let state = get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "merge");
    assert!(state.conflict_count > 0);

    // Abort
    git_abort_operation(dir.path(), "merge").unwrap();
    let after_abort = get_repo_state(dir.path()).unwrap();
    assert_eq!(after_abort.state, "clean");
}

#[test]
fn test_rebase_success() {
    let dir = create_repo_with_branch(false);
    let res = git_rebase(dir.path(), "feature").unwrap();
    assert!(res.success);
    let state = get_repo_state(dir.path()).unwrap();
    assert_eq!(state.state, "clean");
}

fn start_conflicting_cherry_pick(dir: &tempfile::TempDir) {
    let feature = Command::new("git")
        .current_dir(dir.path())
        .args(["rev-parse", "feature"])
        .output()
        .unwrap();
    assert!(feature.status.success());
    let feature_oid = String::from_utf8(feature.stdout).unwrap();
    let result = Command::new("git")
        .current_dir(dir.path())
        .args(["cherry-pick", feature_oid.trim()])
        .output()
        .unwrap();
    assert!(!result.status.success());
    assert_eq!(get_repo_state(dir.path()).unwrap().state, "cherry_pick");
}

#[test]
fn abort_cherry_pick_uses_the_cherry_pick_command() {
    let dir = create_repo_with_branch(true);
    start_conflicting_cherry_pick(&dir);

    git_abort_operation(dir.path(), "cherry_pick").unwrap();

    assert_eq!(get_repo_state(dir.path()).unwrap().state, "clean");
}

#[test]
fn continue_cherry_pick_uses_the_cherry_pick_command() {
    let dir = create_repo_with_branch(true);
    start_conflicting_cherry_pick(&dir);
    fs::write(dir.path().join("shared.txt"), "resolved\n").unwrap();
    let add = Command::new("git")
        .current_dir(dir.path())
        .args(["add", "shared.txt"])
        .output()
        .unwrap();
    assert!(add.status.success());
    let config = Command::new("git")
        .current_dir(dir.path())
        .args(["config", "core.editor", "true"])
        .output()
        .unwrap();
    assert!(config.status.success());

    git_continue_operation(dir.path(), "cherry_pick").unwrap();

    assert_eq!(get_repo_state(dir.path()).unwrap().state, "clean");
}

#[test]
fn abort_revert_uses_the_revert_command() {
    let dir = tempfile::tempdir().unwrap();
    let run = |args: &[&str]| {
        let output = Command::new("git")
            .current_dir(dir.path())
            .args(args)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    };
    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);
    fs::write(dir.path().join("shared.txt"), "base\n").unwrap();
    run(&["add", "shared.txt"]);
    run(&["commit", "-m", "base"]);
    fs::write(dir.path().join("shared.txt"), "one\n").unwrap();
    run(&["commit", "-am", "one"]);
    let one = Command::new("git")
        .current_dir(dir.path())
        .args(["rev-parse", "HEAD"])
        .output()
        .unwrap();
    let one_oid = String::from_utf8(one.stdout).unwrap();
    fs::write(dir.path().join("shared.txt"), "two\n").unwrap();
    run(&["commit", "-am", "two"]);
    let revert = Command::new("git")
        .current_dir(dir.path())
        .args(["revert", one_oid.trim()])
        .output()
        .unwrap();
    assert!(!revert.status.success());
    assert_eq!(get_repo_state(dir.path()).unwrap().state, "revert");

    git_abort_operation(dir.path(), "revert").unwrap();

    assert_eq!(get_repo_state(dir.path()).unwrap().state, "clean");
    assert_eq!(
        fs::read_to_string(dir.path().join("shared.txt"))
            .unwrap()
            .replace("\r\n", "\n"),
        "two\n"
    );
}
