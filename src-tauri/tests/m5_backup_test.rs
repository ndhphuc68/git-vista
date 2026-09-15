use visual_git_lib::write::backup::{create_backup_ref, prune_expired_backups};

fn create_test_repo() -> (tempfile::TempDir, git2::Repository, git2::Oid) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let mut index = repo.index().unwrap();
    let tree_id = index.write_tree().unwrap();
    let commit_id = {
        let tree = repo.find_tree(tree_id).unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "init", &tree, &[]).unwrap()
    };
    (dir, repo, commit_id)
}

#[test]
fn test_create_and_prune_backup_refs() {
    let (_dir, repo, commit_id) = create_test_repo();

    let ref_name = create_backup_ref(&repo, "delete_branch", commit_id).unwrap();
    assert!(ref_name.starts_with("refs/gitui-backup/delete_branch-"));

    let reference = repo.find_reference(&ref_name).unwrap();
    assert_eq!(reference.target().unwrap(), commit_id);

    // Prune với max_age_days = 0 (xoá tất cả)
    let pruned = prune_expired_backups(&repo, 0).unwrap();
    assert_eq!(pruned, 1);
    assert!(repo.find_reference(&ref_name).is_err());
}

#[test]
fn prune_keeps_fresh_commit_undo_tokens() {
    let (dir, repo, commit_id) = create_test_repo();
    let _ = dir;
    // Mirrors the token shape create_commit emits: action-pid-nanos-counter.
    let action = format!("commit-undo-{}-{}-{}", 1234, 99_999_999_999u64, 0);
    let ref_name = create_backup_ref(&repo, &action, commit_id).unwrap();

    // A ref created seconds ago must survive a 30-day retention window.
    let pruned = prune_expired_backups(&repo, 30).unwrap();

    assert_eq!(pruned, 0, "fresh undo token was pruned");
    assert!(repo.find_reference(&ref_name).is_ok());
}

#[test]
fn same_second_backups_do_not_overwrite_each_other() {
    let (dir, repo, first) = create_test_repo();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let tree = head.tree().unwrap();
    let second = repo
        .commit(None, &sig, &sig, "second", &tree, &[&head])
        .unwrap();
    let _ = dir;

    // Two delete-branch backups for different branches within the same second.
    let a = create_backup_ref(&repo, "delete-branch-alpha", first).unwrap();
    let b = create_backup_ref(&repo, "delete-branch-beta", second).unwrap();

    assert!(repo.find_reference(&a).is_ok(), "first backup vanished");
    assert_eq!(repo.find_reference(&a).unwrap().target().unwrap(), first);
    assert_eq!(repo.find_reference(&b).unwrap().target().unwrap(), second);
}

#[test]
fn repeated_backup_of_same_action_within_a_second_keeps_both_commits() {
    let (dir, repo, first) = create_test_repo();
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let tree = head.tree().unwrap();
    let second = repo
        .commit(None, &sig, &sig, "second", &tree, &[&head])
        .unwrap();
    let _ = dir;

    // Two amends in the same second: the same action string, different targets.
    let a = create_backup_ref(&repo, "amend", first).unwrap();
    let b = create_backup_ref(&repo, "amend", second).unwrap();

    assert_ne!(a, b, "same-second amend backups collided into one ref");
    assert_eq!(repo.find_reference(&a).unwrap().target().unwrap(), first);
}

#[test]
fn disambiguated_backups_are_still_prunable_and_respect_retention() {
    let (dir, repo, commit_id) = create_test_repo();
    let _ = dir;
    let sig = git2::Signature::now("Tester", "test@test.com").unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let tree = head.tree().unwrap();
    let other = repo
        .commit(None, &sig, &sig, "other", &tree, &[&head])
        .unwrap();
    let a = create_backup_ref(&repo, "amend", commit_id).unwrap();
    let b = create_backup_ref(&repo, "amend", other).unwrap();
    assert_ne!(a, b);

    // Fresh refs survive a 30-day window...
    assert_eq!(prune_expired_backups(&repo, 30).unwrap(), 0);
    assert!(repo.find_reference(&a).is_ok());
    assert!(repo.find_reference(&b).is_ok());

    // ...and both are reclaimable, including the `.N` disambiguated one.
    assert_eq!(prune_expired_backups(&repo, 0).unwrap(), 2);
    assert!(repo.find_reference(&b).is_err());
}

#[test]
fn opening_a_repository_prunes_only_expired_backups() {
    let (dir, repo, commit_id) = create_test_repo();
    let fresh = create_backup_ref(&repo, "amend", commit_id).unwrap();

    // A backup older than the retention window, written directly.
    let old_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        - 60 * 86400;
    let stale = format!("refs/gitui-backup/amend-{}", old_ts);
    repo.reference(&stale, commit_id, false, "old").unwrap();

    visual_git_lib::commands::open_repository_internal(
        dir.path().to_str().unwrap().to_string(),
    )
    .unwrap();

    let repo = git2::Repository::open(dir.path()).unwrap();
    assert!(
        repo.find_reference(&fresh).is_ok(),
        "a fresh undo backup was pruned"
    );
    assert!(
        repo.find_reference(&stale).is_err(),
        "an expired backup survived"
    );
}
