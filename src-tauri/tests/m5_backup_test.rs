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
