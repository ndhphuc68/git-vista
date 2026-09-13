use std::fs;
use std::process::Command;
use visual_git_lib::write::undo::{undo_commit, undo_delete_branch, undo_discard_file};

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
fn test_undo_commit_soft_resets_to_parent() {
    let (_dir, path) = create_repo();
    let repo = git2::Repository::open(&path).unwrap();
    let first_commit_id = repo.head().unwrap().target().unwrap();

    // Tạo commit 2
    fs::write(repo.workdir().unwrap().join("file.txt"), "v2\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file.txt")).unwrap();
    index.write().unwrap();
    let tree = repo.find_tree(index.write_tree().unwrap()).unwrap();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let parent = repo.find_commit(first_commit_id).unwrap();
    let second_commit_id = repo.commit(Some("HEAD"), &sig, &sig, "commit 2", &tree, &[&parent]).unwrap();

    assert_eq!(repo.head().unwrap().target().unwrap(), second_commit_id);

    // Undo commit 2
    undo_commit(&path).unwrap();

    // HEAD quay về commit 1, và file.txt vẫn còn staged với nội dung v2
    assert_eq!(repo.head().unwrap().target().unwrap(), first_commit_id);
    let statuses = repo.statuses(None).unwrap();
    assert_eq!(statuses.len(), 1);
    assert!(statuses.get(0).unwrap().status().contains(git2::Status::INDEX_MODIFIED));
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

#[test]
fn test_undo_discard_file_restores_content() {
    let (_dir, path) = create_repo();
    let file_p = std::path::Path::new(&path).join("file.txt");

    fs::write(&file_p, "discarded changes").unwrap();
    // Simulate discard by writing original
    fs::write(&file_p, "v1\n").unwrap();

    // Undo discard
    undo_discard_file(&path, "file.txt", "discarded changes").unwrap();
    assert_eq!(fs::read_to_string(&file_p).unwrap(), "discarded changes");
}
