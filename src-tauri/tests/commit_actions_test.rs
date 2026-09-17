use std::fs;
use std::process::Command;
use tempfile::TempDir;
use visual_git_lib::exec::commit_actions::{git_cherry_pick, git_revert};
use visual_git_lib::write::undo::undo_recorded_commit;

fn setup_repo() -> (TempDir, String, String) {
    let dir = TempDir::new().unwrap();
    let repo_path = dir.path();

    let run = |args: &[&str]| {
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(args)
            .output()
            .unwrap();
        assert!(output.status.success(), "Git command failed: {:?}", args);
    };

    run(&["init"]);
    run(&["config", "user.name", "Test User"]);
    run(&["config", "user.email", "test@gitvista.dev"]);

    // Initial commit on main
    fs::write(repo_path.join("file1.txt"), "hello\n").unwrap();
    run(&["add", "file1.txt"]);
    run(&["commit", "-m", "initial commit"]);
    run(&["branch", "-M", "main"]);

    // Create feature branch and commit
    run(&["checkout", "-b", "feature"]);
    fs::write(repo_path.join("feature.txt"), "feature data\n").unwrap();
    run(&["add", "feature.txt"]);
    run(&["commit", "-m", "feature commit"]);

    let feature_commit = String::from_utf8(
        Command::new("git")
            .current_dir(repo_path)
            .args(["rev-parse", "HEAD"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap()
    .trim()
    .to_string();

    // Switch back to main
    run(&["checkout", "main"]);

    // Create commit on main
    fs::write(repo_path.join("main_extra.txt"), "main data\n").unwrap();
    run(&["add", "main_extra.txt"]);
    run(&["commit", "-m", "main extra"]);

    let main_commit = String::from_utf8(
        Command::new("git")
            .current_dir(repo_path)
            .args(["rev-parse", "HEAD"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap()
    .trim()
    .to_string();

    (dir, feature_commit, main_commit)
}

#[test]
fn test_cherry_pick_clean_auto_commit() {
    let (dir, feature_commit, main_commit) = setup_repo();
    let res = git_cherry_pick(dir.path(), &feature_commit, true).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Committed");
    assert!(res.new_commit_id.is_some());
    assert!(res.undo_token.is_some());
    assert!(dir.path().join("feature.txt").exists());

    // Verify undo restores to pre-cherry-pick state
    let token = res.undo_token.as_ref().unwrap();
    undo_recorded_commit(dir.path(), token).unwrap();
    let repo = git2::Repository::open(dir.path()).unwrap();
    assert_eq!(repo.head().unwrap().target().unwrap().to_string(), main_commit);
}

#[test]
fn test_cherry_pick_no_commit() {
    let (dir, feature_commit, _) = setup_repo();
    let res = git_cherry_pick(dir.path(), &feature_commit, false).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Staged");
    assert!(dir.path().join("feature.txt").exists());
}

#[test]
fn test_revert_clean_auto_commit() {
    let (dir, _, main_commit) = setup_repo();
    let res = git_revert(dir.path(), &main_commit, true).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Committed");
    assert!(res.new_commit_id.is_some());
    assert!(res.undo_token.is_some());
    assert!(!dir.path().join("main_extra.txt").exists());

    // Verify undo restores HEAD to pre-revert commit
    let token = res.undo_token.as_ref().unwrap();
    undo_recorded_commit(dir.path(), token).unwrap();
    let repo = git2::Repository::open(dir.path()).unwrap();
    assert_eq!(repo.head().unwrap().target().unwrap().to_string(), main_commit);
}

#[test]
fn test_revert_no_commit() {
    let (dir, _, main_commit) = setup_repo();
    let res = git_revert(dir.path(), &main_commit, false).unwrap();
    assert!(res.success);
    assert_eq!(res.status, "Staged");
}

#[test]
fn test_cherry_pick_conflict() {
    let (dir, _, _) = setup_repo();
    let repo_path = dir.path();
    let run = |args: &[&str]| {
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(args)
            .output()
            .unwrap();
        assert!(output.status.success(), "Git command failed: {:?}", args);
    };

    // Create conflicting commit on conflict-branch
    run(&["checkout", "-b", "conflict-branch"]);
    fs::write(repo_path.join("file1.txt"), "conflict branch content\n").unwrap();
    run(&["add", "file1.txt"]);
    run(&["commit", "-m", "conflict commit"]);
    let conflict_commit = String::from_utf8(
        Command::new("git")
            .current_dir(repo_path)
            .args(["rev-parse", "HEAD"])
            .output()
            .unwrap()
            .stdout,
    )
    .unwrap()
    .trim()
    .to_string();

    // On main, write different content to file1.txt
    run(&["checkout", "main"]);
    fs::write(repo_path.join("file1.txt"), "main branch different content\n").unwrap();
    run(&["add", "file1.txt"]);
    run(&["commit", "-m", "main different content"]);

    let res = git_cherry_pick(dir.path(), &conflict_commit, true).unwrap();
    assert!(!res.success);
    assert_eq!(res.status, "Conflict");
}

#[test]
fn test_operand_validation() {
    let (dir, _, _) = setup_repo();
    assert!(git_cherry_pick(dir.path(), "", true).is_err());
    assert!(git_cherry_pick(dir.path(), "--abort", true).is_err());
    assert!(git_revert(dir.path(), "", true).is_err());
    assert!(git_revert(dir.path(), "-m 1", true).is_err());
}
