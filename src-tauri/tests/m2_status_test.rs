mod common;
use common::fixtures::TestRepoFixture;
use std::fs;
use std::path::Path;
use visual_git_lib::read::status::{get_repo_status, get_working_file_diff, FileStatus};

#[test]
fn test_get_repo_status_classifies_files() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // Modify existing file
    fs::write(repo_path.join("file1.txt"), "modified content").unwrap();
    // Add untracked file
    fs::write(repo_path.join("untracked.txt"), "new file").unwrap();

    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.unstaged.len(), 1);
    assert_eq!(status.unstaged[0].path, "file1.txt");
    assert_eq!(status.unstaged[0].status, FileStatus::Modified);
    assert!(!status.unstaged[0].is_staged);

    assert_eq!(status.untracked.len(), 1);
    assert_eq!(status.untracked[0].path, "untracked.txt");
    assert_eq!(status.untracked[0].status, FileStatus::New);
    assert!(!status.untracked[0].is_staged);

    assert_eq!(status.staged.len(), 0);
}

#[test]
fn test_get_repo_status_staged_changes() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // Modify file1.txt and stage it
    fs::write(repo_path.join("file1.txt"), "staged change").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file1.txt")).unwrap();
    index.write().unwrap();

    // Add a new file and stage it
    fs::write(repo_path.join("staged_new.txt"), "staged new file").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("staged_new.txt")).unwrap();
    index.write().unwrap();

    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.staged.len(), 2);
    
    let file1_staged = status.staged.iter().find(|item| item.path == "file1.txt").unwrap();
    assert_eq!(file1_staged.status, FileStatus::Modified);
    assert!(file1_staged.is_staged);

    let new_staged = status.staged.iter().find(|item| item.path == "staged_new.txt").unwrap();
    assert_eq!(new_staged.status, FileStatus::New);
    assert!(new_staged.is_staged);

    assert_eq!(status.unstaged.len(), 0);
    assert_eq!(status.untracked.len(), 0);
}

#[test]
fn test_get_repo_status_staged_and_unstaged_simultaneous() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // Modify file1.txt and stage it
    fs::write(repo_path.join("file1.txt"), "first modification").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file1.txt")).unwrap();
    index.write().unwrap();

    // Modify file1.txt again in working tree (now both staged and unstaged)
    fs::write(repo_path.join("file1.txt"), "second modification").unwrap();

    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.staged[0].path, "file1.txt");
    assert_eq!(status.staged[0].status, FileStatus::Modified);
    assert!(status.staged[0].is_staged);

    assert_eq!(status.unstaged.len(), 1);
    assert_eq!(status.unstaged[0].path, "file1.txt");
    assert_eq!(status.unstaged[0].status, FileStatus::Modified);
    assert!(!status.unstaged[0].is_staged);
}

#[test]
fn test_get_working_file_diff_unstaged_and_staged() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // 1. Unstaged diff
    fs::write(repo_path.join("file1.txt"), "initial content for file1\nnew line 2\nnew line 3\n").unwrap();
    let unstaged_diff = get_working_file_diff(repo_path, "file1.txt", false, None)
        .expect("unstaged diff should succeed");
    assert_eq!(unstaged_diff.file_path, "file1.txt");
    assert_eq!(unstaged_diff.status, "modified");
    assert!(!unstaged_diff.hunks.is_empty());
    assert!(unstaged_diff.additions > 0 || unstaged_diff.deletions > 0);

    // Staged diff should currently be empty (no staged changes yet)
    let staged_diff_before = get_working_file_diff(repo_path, "file1.txt", true, None)
        .expect("staged diff should succeed");
    assert!(staged_diff_before.hunks.is_empty());
    assert_eq!(staged_diff_before.additions, 0);
    assert_eq!(staged_diff_before.deletions, 0);

    // 2. Stage file1.txt
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("file1.txt")).unwrap();
    index.write().unwrap();

    // Now staged diff should have changes
    let staged_diff_after = get_working_file_diff(repo_path, "file1.txt", true, None)
        .expect("staged diff should succeed");
    assert_eq!(staged_diff_after.file_path, "file1.txt");
    assert_eq!(staged_diff_after.status, "modified");
    assert!(!staged_diff_after.hunks.is_empty());
    assert!(staged_diff_after.additions > 0 || staged_diff_after.deletions > 0);

    // And unstaged diff should now be empty
    let unstaged_diff_after = get_working_file_diff(repo_path, "file1.txt", false, None)
        .expect("unstaged diff should succeed");
    assert!(unstaged_diff_after.hunks.is_empty());
    assert_eq!(unstaged_diff_after.additions, 0);
    assert_eq!(unstaged_diff_after.deletions, 0);
}

#[test]
fn test_get_working_file_diff_untracked_and_staged_new() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // Untracked file
    fs::write(repo_path.join("untracked.txt"), "line 1\nline 2\n").unwrap();
    let diff = get_working_file_diff(repo_path, "untracked.txt", false, None)
        .expect("untracked diff should succeed");
    assert_eq!(diff.file_path, "untracked.txt");
    assert_eq!(diff.status, "added");
    assert!(!diff.hunks.is_empty());
    assert_eq!(diff.additions, 2);
    assert_eq!(diff.deletions, 0);

    // Stage the new file
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("untracked.txt")).unwrap();
    index.write().unwrap();

    let staged_diff = get_working_file_diff(repo_path, "untracked.txt", true, None)
        .expect("staged new diff should succeed");
    assert_eq!(staged_diff.file_path, "untracked.txt");
    assert_eq!(staged_diff.status, "added");
    assert!(!staged_diff.hunks.is_empty());
    assert_eq!(staged_diff.additions, 2);
    assert_eq!(staged_diff.deletions, 0);
}

#[test]
fn test_get_working_file_diff_deleted() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // Delete file1.txt from working tree (unstaged deletion)
    fs::remove_file(repo_path.join("file1.txt")).unwrap();
    let diff = get_working_file_diff(repo_path, "file1.txt", false, None)
        .expect("unstaged deleted diff should succeed");
    assert_eq!(diff.file_path, "file1.txt");
    assert_eq!(diff.status, "deleted");
    assert!(!diff.hunks.is_empty());
    assert!(diff.deletions > 0);
    assert_eq!(diff.additions, 0);

    // Stage deletion
    let mut index = repo.index().unwrap();
    index.remove_path(Path::new("file1.txt")).unwrap();
    index.write().unwrap();

    let staged_diff = get_working_file_diff(repo_path, "file1.txt", true, None)
        .expect("staged deleted diff should succeed");
    assert_eq!(staged_diff.file_path, "file1.txt");
    assert_eq!(staged_diff.status, "deleted");
    assert!(!staged_diff.hunks.is_empty());
    assert!(staged_diff.deletions > 0);
    assert_eq!(staged_diff.additions, 0);
}

#[test]
fn test_get_repo_status_deleted_and_renamed() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let repo = fixture.repo();

    // 1. Test unstaged deletion
    fs::remove_file(repo_path.join("file1.txt")).unwrap();
    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.unstaged.len(), 1);
    assert_eq!(status.unstaged[0].path, "file1.txt");
    assert_eq!(status.unstaged[0].status, FileStatus::Deleted);
    assert!(!status.unstaged[0].is_staged);

    // 2. Stage deletion
    let mut index = repo.index().unwrap();
    index.remove_path(Path::new("file1.txt")).unwrap();
    index.write().unwrap();

    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.staged[0].path, "file1.txt");
    assert_eq!(status.staged[0].status, FileStatus::Deleted);
    assert!(status.staged[0].is_staged);

    // 3. Stage rename: write to file2.txt and remove file1.txt from index with same content
    // Reset back to clean first by checking out
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    repo.reset(head.as_object(), git2::ResetType::Hard, None).unwrap();

    // Move file1.txt to file2.txt in filesystem and index
    fs::rename(repo_path.join("file1.txt"), repo_path.join("file2.txt")).unwrap();
    let mut index = repo.index().unwrap();
    index.remove_path(Path::new("file1.txt")).unwrap();
    index.add_path(Path::new("file2.txt")).unwrap();
    index.write().unwrap();

    let status = get_repo_status(repo_path).expect("status should succeed");
    assert_eq!(status.staged.len(), 1);
    let staged_item = &status.staged[0];
    assert_eq!(staged_item.path, "file2.txt");
    assert_eq!(staged_item.status, FileStatus::Renamed);
    assert_eq!(staged_item.old_path.as_deref(), Some("file1.txt"));
    assert!(staged_item.is_staged);
}
