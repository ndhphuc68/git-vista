mod common;

use common::fixtures::{commit_index, create_clean_repo};
use std::fs;
use std::path::Path;
use visual_git_lib::read::compare::{get_compare_file_diff, get_compare_summary, CompareMode};

#[test]
fn test_compare_commits_direct_mode() {
    let (dir, repo) = create_clean_repo().expect("create clean repo");
    let repo_path = dir.path().to_str().unwrap();

    let initial_oid = repo.head().unwrap().peel_to_commit().unwrap().id();

    // Commit 1: add file1.txt
    let file1_path = dir.path().join("file1.txt");
    fs::write(&file1_path, "Hello World\nLine 2\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file1.txt")).unwrap();
    index.write().unwrap();
    let parent1 = repo.find_commit(initial_oid).unwrap();
    let c1_oid = commit_index(&repo, "Add file1.txt", &[&parent1]).unwrap();

    // Commit 2: modify file1.txt and add file2.txt
    fs::write(&file1_path, "Hello GitVista\nLine 2\nLine 3\n").unwrap();
    let file2_path = dir.path().join("file2.txt");
    fs::write(&file2_path, "New file 2 content\n").unwrap();
    index.add_path(Path::new("file1.txt")).unwrap();
    index.add_path(Path::new("file2.txt")).unwrap();
    index.write().unwrap();
    let parent2 = repo.find_commit(c1_oid).unwrap();
    let c2_oid = commit_index(&repo, "Update file1 and add file2", &[&parent2]).unwrap();

    // Compare initial -> c2
    let summary = get_compare_summary(
        repo_path,
        &initial_oid.to_string(),
        &c2_oid.to_string(),
        CompareMode::Direct,
    )
    .expect("get_compare_summary direct");

    assert_eq!(summary.mode, CompareMode::Direct);
    assert_eq!(summary.resolved_base_oid, initial_oid.to_string());
    assert_eq!(summary.resolved_target_oid, c2_oid.to_string());
    assert_eq!(summary.commits.len(), 2);
    assert_eq!(summary.commits[0].id, c2_oid.to_string());
    assert_eq!(summary.commits[1].id, c1_oid.to_string());

    assert_eq!(summary.files.len(), 2);
    let f1 = summary
        .files
        .iter()
        .find(|f| f.path == "file1.txt")
        .unwrap();
    let f2 = summary
        .files
        .iter()
        .find(|f| f.path == "file2.txt")
        .unwrap();
    assert_eq!(f1.status, "added"); // Added relative to initial_oid tree
    assert_eq!(f2.status, "added");
    assert!(summary.total_additions > 0);
}

#[test]
fn test_compare_commits_merge_base_mode() {
    let (dir, repo) = create_clean_repo().expect("create clean repo");
    let repo_path = dir.path().to_str().unwrap();

    let initial_commit = repo.head().unwrap().peel_to_commit().unwrap();
    let initial_oid = initial_commit.id();

    // Branch "feature" from initial commit
    repo.branch("feature", &initial_commit, false).unwrap();

    // Commit on feature branch
    let sig = common::fixtures::test_signature();
    let feature_file = dir.path().join("feature.txt");
    fs::write(&feature_file, "Feature branch work\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("feature.txt")).unwrap();
    index.write().unwrap();
    let tree_oid = index.write_tree().unwrap();
    let tree = repo.find_tree(tree_oid).unwrap();
    let feature_oid = repo
        .commit(
            Some("refs/heads/feature"),
            &sig,
            &sig,
            "Feature commit",
            &tree,
            &[&initial_commit],
        )
        .unwrap();

    // Reset index for main commit
    let mut index = repo.index().unwrap();
    index.clear().unwrap();
    let main_file = dir.path().join("main_only.txt");
    fs::write(&main_file, "Main branch work\n").unwrap();
    index.add_path(Path::new("main_only.txt")).unwrap();
    index.write().unwrap();
    let main_tree_oid = index.write_tree().unwrap();
    let main_tree = repo.find_tree(main_tree_oid).unwrap();
    let _main_oid = repo
        .commit(
            Some("refs/heads/main"),
            &sig,
            &sig,
            "Main commit",
            &main_tree,
            &[&initial_commit],
        )
        .unwrap();

    // Compare main (base) -> feature (target) in MergeBase mode (A...B)
    let summary = get_compare_summary(repo_path, "main", "feature", CompareMode::MergeBase)
        .expect("get_compare_summary merge_base");

    assert_eq!(summary.mode, CompareMode::MergeBase);
    assert_eq!(summary.merge_base_oid, Some(initial_oid.to_string()));
    assert_eq!(summary.effective_base_oid, initial_oid.to_string());

    // In MergeBase mode, commits should only be Feature commit
    assert_eq!(summary.commits.len(), 1);
    assert_eq!(summary.commits[0].id, feature_oid.to_string());

    // Files should only be feature.txt, not main_only.txt!
    assert_eq!(summary.files.len(), 1);
    assert_eq!(summary.files[0].path, "feature.txt");
    assert_eq!(summary.files[0].status, "added");
}

#[test]
fn test_compare_identical_revisions() {
    let (dir, repo) = create_clean_repo().expect("create clean repo");
    let repo_path = dir.path().to_str().unwrap();
    let head_oid = repo
        .head()
        .unwrap()
        .peel_to_commit()
        .unwrap()
        .id()
        .to_string();

    let summary = get_compare_summary(repo_path, &head_oid, &head_oid, CompareMode::Direct)
        .expect("compare identical");

    assert_eq!(summary.commits.len(), 0);
    assert_eq!(summary.files.len(), 0);
    assert_eq!(summary.total_additions, 0);
    assert_eq!(summary.total_deletions, 0);
}

#[test]
fn test_compare_file_diff() {
    let (dir, repo) = create_clean_repo().expect("create clean repo");
    let repo_path = dir.path().to_str().unwrap();

    let initial_commit = repo.head().unwrap().peel_to_commit().unwrap();
    let initial_oid = initial_commit.id();

    let file_path = dir.path().join("test.txt");
    fs::write(&file_path, "Line 1\nLine 2\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("test.txt")).unwrap();
    index.write().unwrap();
    let c1_oid = commit_index(&repo, "Add test.txt", &[&initial_commit]).unwrap();

    let diff_result = get_compare_file_diff(
        repo_path,
        &initial_oid.to_string(),
        &c1_oid.to_string(),
        "test.txt",
        CompareMode::Direct,
        false,
    )
    .expect("get_compare_file_diff");

    assert_eq!(diff_result.file_path, "test.txt");
    assert_eq!(diff_result.status, "added");
    assert!(!diff_result.hunks.is_empty());
    assert_eq!(diff_result.additions, 2);
}
