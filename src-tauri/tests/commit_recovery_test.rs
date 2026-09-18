use git2::Repository;
use std::{fs, path::Path};
use visual_git_lib::write::{commit::create_commit, undo::undo_recorded_commit};

fn repo() -> (tempfile::TempDir, Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = Repository::init(dir.path()).unwrap();
    repo.config()
        .unwrap()
        .set_str("user.name", "Tester")
        .unwrap();
    repo.config()
        .unwrap()
        .set_str("user.email", "test@example.com")
        .unwrap();
    fs::write(dir.path().join("file.txt"), b"first\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file.txt")).unwrap();
    index.write().unwrap();
    (dir, repo)
}

#[test]
fn undo_amend_restores_original_commit_instead_of_its_parent() {
    let (dir, repo) = repo();
    create_commit(dir.path(), "first", None, false).unwrap();
    let original = create_commit(dir.path(), "second", None, false).unwrap();
    let amended = create_commit(dir.path(), "amended", None, true).unwrap();
    undo_recorded_commit(dir.path(), amended.undo_token.as_ref().unwrap()).unwrap();
    assert_eq!(
        repo.head().unwrap().target().unwrap().to_string(),
        original.id
    );
}

#[test]
fn undo_preserves_staged_and_unstaged_content() {
    let (dir, repo) = repo();
    let first = create_commit(dir.path(), "first", None, false).unwrap();
    fs::write(dir.path().join("file.txt"), b"staged\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file.txt")).unwrap();
    index.write().unwrap();
    let second = create_commit(dir.path(), "second", None, false).unwrap();
    fs::write(dir.path().join("file.txt"), b"new unsaved work\n").unwrap();
    undo_recorded_commit(dir.path(), second.undo_token.as_ref().unwrap()).unwrap();
    assert_eq!(repo.head().unwrap().target().unwrap().to_string(), first.id);
    let entry = repo
        .index()
        .unwrap()
        .get_path(Path::new("file.txt"), 0)
        .unwrap();
    assert_eq!(repo.find_blob(entry.id).unwrap().content(), b"staged\n");
    assert_eq!(
        fs::read(dir.path().join("file.txt")).unwrap(),
        b"new unsaved work\n"
    );
}

#[test]
fn stale_undo_cannot_rewind_a_later_commit_or_another_branch() {
    let (dir, repo) = repo();
    let first = create_commit(dir.path(), "first", None, false).unwrap();
    let second = create_commit(dir.path(), "second", None, false).unwrap();
    assert!(undo_recorded_commit(dir.path(), first.undo_token.as_ref().unwrap()).is_err());
    let commit = repo.head().unwrap().peel_to_commit().unwrap();
    repo.branch("other", &commit, false).unwrap();
    repo.set_head("refs/heads/other").unwrap();
    assert!(undo_recorded_commit(dir.path(), second.undo_token.as_ref().unwrap()).is_err());
    assert_eq!(
        repo.head().unwrap().target().unwrap().to_string(),
        second.id
    );
}

#[test]
fn undo_initial_commit_returns_to_unborn_branch_without_losing_files() {
    let (dir, repo) = repo();
    let first = create_commit(dir.path(), "first", None, false).unwrap();
    undo_recorded_commit(dir.path(), first.undo_token.as_ref().unwrap()).unwrap();
    assert_eq!(
        repo.head().err().map(|e| e.code()),
        Some(git2::ErrorCode::UnbornBranch)
    );
    assert_eq!(fs::read(dir.path().join("file.txt")).unwrap(), b"first\n");
    assert_eq!(repo.index().unwrap().len(), 1);
    assert!(undo_recorded_commit(dir.path(), first.undo_token.as_ref().unwrap()).is_err());
}

#[test]
fn repeated_amends_have_independent_backups_and_restore_in_order() {
    let (dir, repo) = repo();
    let first = create_commit(dir.path(), "first", None, false).unwrap();
    let second = create_commit(dir.path(), "amend one", None, true).unwrap();
    let third = create_commit(dir.path(), "amend two", None, true).unwrap();
    assert_ne!(second.undo_token, third.undo_token);
    undo_recorded_commit(dir.path(), third.undo_token.as_ref().unwrap()).unwrap();
    assert_eq!(
        repo.head().unwrap().target().unwrap().to_string(),
        second.id
    );
    undo_recorded_commit(dir.path(), second.undo_token.as_ref().unwrap()).unwrap();
    assert_eq!(repo.head().unwrap().target().unwrap().to_string(), first.id);
}

#[test]
fn refuses_recovery_from_other_repository_and_in_progress_operation() {
    let (dir, repo) = repo();
    let first = create_commit(dir.path(), "first", None, false).unwrap();
    let (other, _) = self::repo();
    assert!(undo_recorded_commit(other.path(), first.undo_token.as_ref().unwrap()).is_err());
    fs::write(repo.path().join("MERGE_HEAD"), &first.id).unwrap();
    assert!(undo_recorded_commit(dir.path(), first.undo_token.as_ref().unwrap()).is_err());
    assert_eq!(repo.head().unwrap().target().unwrap().to_string(), first.id);
}

#[test]
fn rapid_amends_keep_every_pre_amend_commit_reachable() {
    let (dir, repo) = repo();
    create_commit(dir.path(), "first", None, false).unwrap();
    let original = create_commit(dir.path(), "second", None, false).unwrap();
    let amended_once = create_commit(dir.path(), "amend one", None, true).unwrap();
    create_commit(dir.path(), "amend two", None, true).unwrap();

    // Every commit an amend overwrote must still be reachable via a backup ref.
    let backups: Vec<String> = repo
        .references_glob("refs/gitui-backup/amend-*")
        .unwrap()
        .flatten()
        .filter_map(|r| r.target().map(|t| t.to_string()))
        .collect();

    for lost in [&original.id, &amended_once.id] {
        assert!(
            backups.contains(lost),
            "amend backup for {lost} was overwritten; backups={backups:?}"
        );
    }
}
