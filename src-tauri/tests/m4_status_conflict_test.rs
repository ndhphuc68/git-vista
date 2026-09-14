use std::fs;
use std::process::Command;
use visual_git_lib::read::status::{get_repo_status, FileStatus};

fn create_conflict_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("conflict.txt"), "base content\n").unwrap();
    run(&["add", "conflict.txt"]);
    run(&["commit", "-m", "initial"]);
    run(&["branch", "-M", "main"]);

    run(&["checkout", "-b", "feature"]);
    fs::write(p.join("conflict.txt"), "feature content\n").unwrap();
    run(&["commit", "-am", "feature commit"]);

    run(&["checkout", "main"]);
    fs::write(p.join("conflict.txt"), "main content\n").unwrap();
    run(&["commit", "-am", "main commit"]);

    // Merge gây conflict (không assert success)
    let _ = Command::new("git").current_dir(p).args(["merge", "feature"]).output().unwrap();

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_get_repo_status_detects_conflicted_files() {
    let (_dir, repo_path) = create_conflict_repo();

    let status = get_repo_status(&repo_path).unwrap();
    assert_eq!(status.conflicted.len(), 1);
    assert_eq!(status.conflicted[0].path, "conflict.txt");
    assert_eq!(status.conflicted[0].status, FileStatus::Conflicted);
}
