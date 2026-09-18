use std::fs;
use std::path::Path;
use tempfile::TempDir;
use visual_git_lib::read::blame::get_file_blame;
use visual_git_lib::read::file_history::get_file_history;

fn setup_repo() -> (TempDir, String, String, String) {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();

    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Alice").unwrap();
    config.set_str("user.email", "alice@example.com").unwrap();

    let file_path = dir.path().join("hello.txt");
    fs::write(&file_path, "Line 1 by Alice\nLine 2 by Alice\nLine 3 by Alice\n").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(Path::new("hello.txt")).unwrap();
    index.write().unwrap();
    let tree_id1 = index.write_tree().unwrap();
    let tree1 = repo.find_tree(tree_id1).unwrap();
    let sig_alice = git2::Signature::now("Alice", "alice@example.com").unwrap();
    let commit1 = repo
        .commit(Some("HEAD"), &sig_alice, &sig_alice, "Commit 1 by Alice", &tree1, &[])
        .unwrap();

    // Commit 2 by Bob modifying Line 2
    let sig_bob = git2::Signature::now("Bob", "bob@example.com").unwrap();
    fs::write(&file_path, "Line 1 by Alice\nLine 2 by Bob\nLine 3 by Alice\n").unwrap();
    index.add_path(Path::new("hello.txt")).unwrap();
    index.write().unwrap();
    let tree_id2 = index.write_tree().unwrap();
    let tree2 = repo.find_tree(tree_id2).unwrap();
    let parent1 = repo.find_commit(commit1).unwrap();
    let commit2 = repo
        .commit(Some("HEAD"), &sig_bob, &sig_bob, "Commit 2 by Bob", &tree2, &[&parent1])
        .unwrap();

    // Commit 3 touching unrelated file
    let other_file = dir.path().join("other.txt");
    fs::write(&other_file, "Unrelated file content\n").unwrap();
    index.add_path(Path::new("other.txt")).unwrap();
    index.write().unwrap();
    let tree_id3 = index.write_tree().unwrap();
    let tree3 = repo.find_tree(tree_id3).unwrap();
    let parent2 = repo.find_commit(commit2).unwrap();
    let commit3 = repo
        .commit(Some("HEAD"), &sig_alice, &sig_alice, "Commit 3 by Alice", &tree3, &[&parent2])
        .unwrap();

    (dir, commit1.to_string(), commit2.to_string(), commit3.to_string())
}

#[test]
fn test_get_file_blame_multi_author() {
    let (dir, commit1_id, commit2_id, _) = setup_repo();

    let blame = get_file_blame(dir.path(), "hello.txt", None).unwrap();
    assert_eq!(blame.total_lines, 3);
    assert_eq!(blame.lines.len(), 3);

    // Line 1: Alice, commit 1
    assert_eq!(blame.lines[0].line_no, 1);
    assert_eq!(blame.lines[0].author_name, "Alice");
    assert_eq!(blame.lines[0].commit_id, commit1_id);
    assert_eq!(blame.lines[0].content, "Line 1 by Alice");
    assert!(blame.lines[0].is_hunk_start);

    // Line 2: Bob, commit 2
    assert_eq!(blame.lines[1].line_no, 2);
    assert_eq!(blame.lines[1].author_name, "Bob");
    assert_eq!(blame.lines[1].commit_id, commit2_id);
    assert_eq!(blame.lines[1].content, "Line 2 by Bob");
    assert!(blame.lines[1].is_hunk_start);

    // Line 3: Alice, commit 1
    assert_eq!(blame.lines[2].line_no, 3);
    assert_eq!(blame.lines[2].author_name, "Alice");
    assert_eq!(blame.lines[2].commit_id, commit1_id);
    assert_eq!(blame.lines[2].content, "Line 3 by Alice");
    assert!(blame.lines[2].is_hunk_start);
}

#[test]
fn test_get_file_history_filtered_and_paginated() {
    let (dir, commit1_id, commit2_id, _commit3_id) = setup_repo();

    let history = get_file_history(dir.path(), "hello.txt", Some(0), Some(10)).unwrap();
    assert_eq!(history.total_count, 2);
    assert_eq!(history.commits.len(), 2);
    assert!(!history.has_more);

    // Commits in reverse-chronological order: commit2, then commit1
    assert_eq!(history.commits[0].commit_id, commit2_id);
    assert_eq!(history.commits[0].change_type, "modified");
    assert_eq!(history.commits[0].author_name, "Bob");

    assert_eq!(history.commits[1].commit_id, commit1_id);
    assert_eq!(history.commits[1].change_type, "added");
    assert_eq!(history.commits[1].author_name, "Alice");

    // Test pagination
    let page1 = get_file_history(dir.path(), "hello.txt", Some(0), Some(1)).unwrap();
    assert_eq!(page1.commits.len(), 1);
    assert_eq!(page1.commits[0].commit_id, commit2_id);
    assert!(page1.has_more);

    let page2 = get_file_history(dir.path(), "hello.txt", Some(1), Some(1)).unwrap();
    assert_eq!(page2.commits.len(), 1);
    assert_eq!(page2.commits[0].commit_id, commit1_id);
    assert!(!page2.has_more);
}
