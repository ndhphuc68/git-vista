use std::fs;
use std::path::Path;
use tempfile::TempDir;
use visual_git_lib::read::diff::get_file_diff;
use visual_git_lib::read::status::get_working_file_diff;

fn setup_test_repo_with_whitespace_change() -> (TempDir, String) {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();

    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();

    let file_path = dir.path().join("code.txt");
    fs::write(&file_path, "function test() {\n    return 42;\n}\n").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(Path::new("code.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();
    let sig = repo.signature().unwrap();
    let commit1 = repo
        .commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
        .unwrap();

    // Commit 2: change indentation only (spaces to tabs / extra spaces)
    fs::write(&file_path, "function test() {\n        return 42;\n}\n").unwrap();
    index.add_path(Path::new("code.txt")).unwrap();
    index.write().unwrap();
    let tree_id2 = index.write_tree().unwrap();
    let tree2 = repo.find_tree(tree_id2).unwrap();
    let parent = repo.find_commit(commit1).unwrap();
    let commit2 = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            "Whitespace only commit",
            &tree2,
            &[&parent],
        )
        .unwrap();

    (dir, commit2.to_string())
}

#[test]
fn test_get_file_diff_respects_ignore_whitespace() {
    let (dir, commit2_id) = setup_test_repo_with_whitespace_change();

    // Default or ignore_whitespace = false should find differences
    let diff_normal = get_file_diff(dir.path(), &commit2_id, "code.txt", Some(false)).unwrap();
    assert_eq!(diff_normal.hunks.len(), 1);

    // ignore_whitespace = true should filter out whitespace-only changes
    let diff_ignored = get_file_diff(dir.path(), &commit2_id, "code.txt", Some(true)).unwrap();
    assert_eq!(diff_ignored.hunks.len(), 0);
}

#[test]
fn test_get_working_file_diff_respects_ignore_whitespace() {
    let (dir, _) = setup_test_repo_with_whitespace_change();
    let file_path = dir.path().join("code.txt");

    // Add trailing whitespace to working tree
    fs::write(&file_path, "function test() {\n        return 42;   \n}\n").unwrap();

    let diff_normal = get_working_file_diff(dir.path(), "code.txt", false, Some(false)).unwrap();
    assert_eq!(diff_normal.hunks.len(), 1);

    let diff_ignored = get_working_file_diff(dir.path(), "code.txt", false, Some(true)).unwrap();
    assert_eq!(diff_ignored.hunks.len(), 0);
}
