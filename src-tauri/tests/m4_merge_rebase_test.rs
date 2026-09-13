use std::fs;
use std::process::Command;
use visual_git_lib::exec::merge::{git_abort_operation, git_merge, git_rebase};
use visual_git_lib::read::state::get_repo_state;

fn create_repo_with_branch(conflict: bool) -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
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
    fs::write(p.join("shared.txt"), if conflict { "feature edit\n" } else { "line 1\nfeature add\n" }).unwrap();
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
