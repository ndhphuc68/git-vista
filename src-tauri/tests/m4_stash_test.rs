use std::fs;
use std::path::Path;
use visual_git_lib::write::stash::{apply_stash, drop_stash, get_stashes, pop_stash, save_stash};
use visual_git_lib::write::undo::undo_drop_stash;

fn create_temp_repo(_name: &str) -> (tempfile::TempDir, git2::Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();
    config.set_bool("core.autocrlf", false).unwrap();

    let file_path = dir.path().join("file.txt");
    fs::write(&file_path, "initial content\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    {
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
            .unwrap();
    }

    (dir, repo)
}

#[test]
fn test_stash_lifecycle_save_get_apply_pop_drop() {
    let (dir, repo) = create_temp_repo("stash_test");
    let repo_path = dir.path().to_str().unwrap();

    // 1. Tạo thay đổi file và file mới untracked
    fs::write(dir.path().join("file.txt"), "modified content\n").unwrap();
    fs::write(dir.path().join("untracked.txt"), "untracked content\n").unwrap();

    // 2. Save stash (include_untracked = true)
    let commit_id = save_stash(repo_path, Some("Test my stash"), true).unwrap();
    assert!(!commit_id.is_empty());

    // Working tree phải sạch sau khi stash
    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true);
    let statuses = repo.statuses(Some(&mut status_opts)).unwrap();
    assert_eq!(statuses.len(), 0);

    // 3. Get stashes
    let stashes = get_stashes(repo_path).unwrap();
    assert_eq!(stashes.len(), 1);
    assert_eq!(stashes[0].index, 0);
    assert!(stashes[0].message.contains("Test my stash"));

    // 4. Apply stash (áp dụng lại nhưng vẫn giữ stash)
    apply_stash(repo_path, 0).unwrap();
    assert_eq!(
        fs::read_to_string(dir.path().join("file.txt"))
            .unwrap()
            .replace("\r\n", "\n"),
        "modified content\n"
    );
    let stashes_after_apply = get_stashes(repo_path).unwrap();
    assert_eq!(stashes_after_apply.len(), 1);

    // 5. Drop stash
    drop_stash(repo_path, 0).unwrap();
    let stashes_after_drop = get_stashes(repo_path).unwrap();
    assert_eq!(stashes_after_drop.len(), 0);

    // 6. Test Pop stash
    fs::write(dir.path().join("file.txt"), "second modification\n").unwrap();
    save_stash(repo_path, Some("Pop me"), false).unwrap();
    assert_eq!(get_stashes(repo_path).unwrap().len(), 1);

    pop_stash(repo_path, 0).unwrap();
    assert_eq!(get_stashes(repo_path).unwrap().len(), 0);
    assert_eq!(
        fs::read_to_string(dir.path().join("file.txt"))
            .unwrap()
            .replace("\r\n", "\n"),
        "second modification\n"
    );
}

#[test]
fn undo_drop_restores_a_non_top_stash_at_its_original_index() {
    let (dir, _repo) = create_temp_repo("stash_undo_order");
    let repo_path = dir.path().to_str().unwrap();
    fs::write(dir.path().join("file.txt"), "first\n").unwrap();
    save_stash(repo_path, Some("first"), false).unwrap();
    fs::write(dir.path().join("file.txt"), "second\n").unwrap();
    save_stash(repo_path, Some("second"), false).unwrap();

    let original = get_stashes(repo_path).unwrap();
    let receipt = drop_stash(repo_path, 1).unwrap();
    undo_drop_stash(repo_path, &receipt).unwrap();

    let restored = get_stashes(repo_path).unwrap();
    let original_ids: Vec<_> = original.iter().map(|stash| &stash.commit_id).collect();
    let restored_ids: Vec<_> = restored.iter().map(|stash| &stash.commit_id).collect();
    assert_eq!(restored_ids, original_ids);
}

#[test]
fn undo_drop_refuses_to_overwrite_a_changed_stash_list() {
    let (dir, _repo) = create_temp_repo("stash_undo_stale");
    let repo_path = dir.path().to_str().unwrap();
    fs::write(dir.path().join("file.txt"), "first\n").unwrap();
    save_stash(repo_path, Some("first"), false).unwrap();
    fs::write(dir.path().join("file.txt"), "second\n").unwrap();
    save_stash(repo_path, Some("second"), false).unwrap();
    let receipt = drop_stash(repo_path, 1).unwrap();
    fs::write(dir.path().join("file.txt"), "later\n").unwrap();
    save_stash(repo_path, Some("later"), false).unwrap();
    let before_undo = get_stashes(repo_path).unwrap();

    assert!(undo_drop_stash(repo_path, &receipt).is_err());

    assert_eq!(get_stashes(repo_path).unwrap(), before_undo);
}

#[test]
fn undo_drop_restores_the_only_stash() {
    let (dir, _repo) = create_temp_repo("stash_undo_only");
    let repo_path = dir.path().to_str().unwrap();
    fs::write(dir.path().join("file.txt"), "only\n").unwrap();
    save_stash(repo_path, Some("only"), false).unwrap();
    let original = get_stashes(repo_path).unwrap();
    let receipt = drop_stash(repo_path, 0).unwrap();
    assert!(get_stashes(repo_path).unwrap().is_empty());

    undo_drop_stash(repo_path, &receipt).unwrap();

    assert_eq!(get_stashes(repo_path).unwrap(), original);
    assert!(undo_drop_stash(repo_path, &receipt).is_err());
}

#[test]
fn undo_drop_respects_a_concurrent_stash_lock() {
    let (dir, repo) = create_temp_repo("stash_undo_lock");
    let repo_path = dir.path().to_str().unwrap();
    fs::write(dir.path().join("file.txt"), "locked\n").unwrap();
    save_stash(repo_path, Some("locked"), false).unwrap();
    let receipt = drop_stash(repo_path, 0).unwrap();
    let after_drop = get_stashes(repo_path).unwrap();
    let mut blocker = repo.transaction().unwrap();
    blocker.lock_ref("refs/stash").unwrap();

    assert!(undo_drop_stash(repo_path, &receipt).is_err());
    assert_eq!(get_stashes(repo_path).unwrap(), after_drop);

    drop(blocker);
    undo_drop_stash(repo_path, &receipt).unwrap();
    assert_eq!(get_stashes(repo_path).unwrap().len(), 1);
}

#[test]
fn drop_stash_does_not_create_a_receipt_when_the_stash_ref_is_locked() {
    let (dir, repo) = create_temp_repo("stash_drop_lock");
    let repo_path = dir.path().to_str().unwrap();
    fs::write(dir.path().join("file.txt"), "locked\n").unwrap();
    save_stash(repo_path, Some("locked"), false).unwrap();
    let original = get_stashes(repo_path).unwrap();
    let before = repo
        .references_glob("refs/gitui-backup/*")
        .unwrap()
        .flatten()
        .count();
    let mut blocker = repo.transaction().unwrap();
    blocker.lock_ref("refs/stash").unwrap();

    assert!(drop_stash(repo_path, 0).is_err());
    assert_eq!(get_stashes(repo_path).unwrap(), original);
    let after = repo
        .references_glob("refs/gitui-backup/*")
        .unwrap()
        .flatten()
        .count();
    assert_eq!(after, before);
}
