use std::fs;
use std::process::Command;
use visual_git_lib::write::branch::delete_branch;
use visual_git_lib::write::undo::undo_delete_branch;

fn create_repo() -> (tempfile::TempDir, String) {
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

    fs::write(p.join("file.txt"), "v1\n").unwrap();
    run(&["add", "file.txt"]);
    run(&["commit", "-m", "commit 1"]);
    run(&["branch", "-M", "main"]);

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}
#[test]
fn test_undo_delete_branch_restores_branch() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    repo.branch(
        "feature",
        &repo
            .find_commit(repo.head().unwrap().target().unwrap())
            .unwrap(),
        false,
    )
    .unwrap();
    let backup_ref = delete_branch(&path, "feature", false).unwrap();
    assert!(repo
        .find_branch("feature", git2::BranchType::Local)
        .is_err());

    // Undo delete branch
    undo_delete_branch(&path, "feature", &backup_ref).unwrap();
    assert!(repo.find_branch("feature", git2::BranchType::Local).is_ok());
}

#[test]
fn undo_delete_branch_rejects_arbitrary_commit_ids() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let commit_id = repo.head().unwrap().target().unwrap().to_string();

    assert!(undo_delete_branch(&path, "feature", &commit_id).is_err());
    assert!(repo
        .find_branch("feature", git2::BranchType::Local)
        .is_err());
}

#[test]
fn undo_delete_branch_rejects_a_receipt_for_another_branch() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let head = repo.find_commit(repo.head().unwrap().target().unwrap()).unwrap();
    repo.branch("foo", &head, false).unwrap();
    repo.branch("foo-bar", &head, false).unwrap();
    let _foo_receipt = delete_branch(&path, "foo", false).unwrap();
    let wrong_receipt = delete_branch(&path, "foo-bar", false).unwrap();

    assert!(undo_delete_branch(&path, "foo", &wrong_receipt).is_err());
    assert!(repo.find_branch("foo", git2::BranchType::Local).is_err());
}

#[test]
fn branch_delete_receipts_are_single_use() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let head = repo.find_commit(repo.head().unwrap().target().unwrap()).unwrap();
    repo.branch("feature", &head, false).unwrap();
    let first_receipt = delete_branch(&path, "feature", false).unwrap();
    undo_delete_branch(&path, "feature", &first_receipt).unwrap();
    let second_receipt = delete_branch(&path, "feature", false).unwrap();

    assert!(undo_delete_branch(&path, "feature", &first_receipt).is_err());
    undo_delete_branch(&path, "feature", &second_receipt).unwrap();
}
