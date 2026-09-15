use std::fs;
use std::process::Command;
use visual_git_lib::write::undo::undo_delete_branch;

fn create_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
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
    let commit_id = repo.head().unwrap().target().unwrap().to_string();

    // Tạo branch feature rồi xoá
    let mut branch = repo.branch("feature", &repo.find_commit(repo.head().unwrap().target().unwrap()).unwrap(), false).unwrap();
    branch.delete().unwrap();
    assert!(repo.find_branch("feature", git2::BranchType::Local).is_err());

    // Undo delete branch
    undo_delete_branch(&path, "feature", &commit_id).unwrap();
    assert!(repo.find_branch("feature", git2::BranchType::Local).is_ok());
}
