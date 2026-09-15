use super::*;
use git2::{Repository, Signature};
fn setup() -> (tempfile::TempDir, Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = Repository::init(dir.path()).unwrap();
    std::fs::write(dir.path().join("a.bin"), b"head").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("a.bin")).unwrap();
    index.write().unwrap();
    let oid = index.write_tree().unwrap();
    let tree = repo.find_tree(oid).unwrap();
    let sig = Signature::now("Test", "test@example.com").unwrap();
    repo.commit(Some("HEAD"), &sig, &sig, "initial", &tree, &[])
        .unwrap();
    drop(tree);
    (dir, repo)
}
#[test]
fn binary_roundtrip_preserves_index_and_token_is_single_use() {
    let (dir, repo) = setup();
    let path = dir.path().to_str().unwrap();
    std::fs::write(dir.path().join("a.bin"), b"staged").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("a.bin")).unwrap();
    index.write().unwrap();
    std::fs::write(dir.path().join("a.bin"), [0, 255, 1]).unwrap();
    let token = discard_with_backup(path, "a.bin").unwrap();
    assert_eq!(std::fs::read(dir.path().join("a.bin")).unwrap(), b"staged");
    restore_discard(path, &token).unwrap();
    assert_eq!(
        std::fs::read(dir.path().join("a.bin")).unwrap(),
        [0, 255, 1]
    );
    assert_eq!(
        repo.index()
            .unwrap()
            .get_path(Path::new("a.bin"), 0)
            .unwrap()
            .id,
        index.get_path(Path::new("a.bin"), 0).unwrap().id
    );
    assert!(restore_discard(path, &token).is_err());
}
#[test]
fn deleted_file_roundtrip() {
    let (dir, _) = setup();
    let path = dir.path().to_str().unwrap();
    std::fs::remove_file(dir.path().join("a.bin")).unwrap();
    let token = discard_with_backup(path, "a.bin").unwrap();
    assert!(dir.path().join("a.bin").exists());
    restore_discard(path, &token).unwrap();
    assert!(!dir.path().join("a.bin").exists());
}
#[test]
fn refuses_changed_file_and_wrong_repository() {
    let (dir, _) = setup();
    let (other, _) = setup();
    let path = dir.path().to_str().unwrap();
    std::fs::write(dir.path().join("a.bin"), b"dirty").unwrap();
    let token = discard_with_backup(path, "a.bin").unwrap();
    assert!(restore_discard(other.path().to_str().unwrap(), &token).is_err());
    std::fs::write(dir.path().join("a.bin"), b"new edit").unwrap();
    assert!(restore_discard(path, &token).is_err());
    assert_eq!(
        std::fs::read(dir.path().join("a.bin")).unwrap(),
        b"new edit"
    );
}
#[test]
fn untracked_roundtrip_and_path_rejection() {
    let (dir, _) = setup();
    let path = dir.path().to_str().unwrap();
    std::fs::write(dir.path().join("new"), b"untracked").unwrap();
    let token = discard_with_backup(path, "new").unwrap();
    assert!(!dir.path().join("new").exists());
    restore_discard(path, &token).unwrap();
    assert_eq!(std::fs::read(dir.path().join("new")).unwrap(), b"untracked");
    for bad in ["../outside", ".git/config", "a.bin/../a.bin", "C:\\outside"] {
        assert!(discard_with_backup(path, bad).is_err(), "{bad}");
    }
    assert!(restore_discard(path, "../bad").is_err());
}
#[test]
fn rejects_directories_and_conflicts() {
    let (dir, repo) = setup();
    let path = dir.path().to_str().unwrap();
    std::fs::create_dir(dir.path().join("folder")).unwrap();
    assert!(discard_with_backup(path, "folder").is_err());
    let mut index = repo.index().unwrap();
    let mut entry = index.get_path(Path::new("a.bin"), 0).unwrap();
    index.remove_path(Path::new("a.bin")).unwrap();
    entry.flags = (entry.flags & !0x3000) | 0x1000;
    index.add(&entry).unwrap();
    index.write().unwrap();
    assert!(discard_with_backup(path, "a.bin").is_err());
}
#[cfg(unix)]
#[test]
fn rejects_symlink_target_and_parent() {
    let (dir, _) = setup();
    let outside = tempfile::tempdir().unwrap();
    std::fs::write(outside.path().join("secret"), b"safe").unwrap();
    std::os::unix::fs::symlink(outside.path(), dir.path().join("link")).unwrap();
    assert!(discard_with_backup(dir.path().to_str().unwrap(), "link/secret").is_err());
    std::os::unix::fs::symlink(outside.path().join("secret"), dir.path().join("file-link"))
        .unwrap();
    assert!(discard_with_backup(dir.path().to_str().unwrap(), "file-link").is_err());
}
#[test]
fn discard_does_not_change_other_hardlinks() {
    let (dir, _) = setup();
    let outside = dir.path().join("other-link");
    std::fs::write(dir.path().join("a.bin"), b"dirty").unwrap();
    std::fs::hard_link(dir.path().join("a.bin"), &outside).unwrap();
    discard_with_backup(dir.path().to_str().unwrap(), "a.bin").unwrap();
    assert_eq!(std::fs::read(outside).unwrap(), b"dirty");
}
#[test]
fn unlocked_existing_operation_lock_does_not_block_recovery() {
    let (dir, repo) = setup();
    let storage = repo.path().join("visual-git-discard");
    std::fs::create_dir(&storage).unwrap();
    std::fs::write(storage.join("operation.lock"), b"").unwrap();
    std::fs::write(dir.path().join("a.bin"), b"dirty").unwrap();
    let token = discard_with_backup(dir.path().to_str().unwrap(), "a.bin").unwrap();
    restore_discard(dir.path().to_str().unwrap(), &token).unwrap();
}
#[test]
fn restores_file_deleted_with_its_parent_directory() {
    let (dir, repo) = setup();
    std::fs::create_dir(dir.path().join("nested")).unwrap();
    std::fs::write(dir.path().join("nested/file"), b"staged nested").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("nested/file")).unwrap();
    index.write().unwrap();
    std::fs::remove_file(dir.path().join("nested/file")).unwrap();
    std::fs::remove_dir(dir.path().join("nested")).unwrap();
    let token = discard_with_backup(dir.path().to_str().unwrap(), "nested/file").unwrap();
    assert_eq!(
        std::fs::read(dir.path().join("nested/file")).unwrap(),
        b"staged nested"
    );
    restore_discard(dir.path().to_str().unwrap(), &token).unwrap();
    assert!(!dir.path().join("nested/file").exists());
}
