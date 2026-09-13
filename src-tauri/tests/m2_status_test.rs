mod common;
use common::fixtures::TestRepoFixture;
use std::fs;
use visual_git_lib::read::status::{get_repo_status, FileStatus};

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
    assert_eq!(status.unstaged[0].is_staged, false);

    assert_eq!(status.untracked.len(), 1);
    assert_eq!(status.untracked[0].path, "untracked.txt");
    assert_eq!(status.untracked[0].status, FileStatus::New);
    assert_eq!(status.untracked[0].is_staged, false);

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
    assert_eq!(file1_staged.is_staged, true);

    let new_staged = status.staged.iter().find(|item| item.path == "staged_new.txt").unwrap();
    assert_eq!(new_staged.status, FileStatus::New);
    assert_eq!(new_staged.is_staged, true);

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
    assert_eq!(status.staged[0].is_staged, true);

    assert_eq!(status.unstaged.len(), 1);
    assert_eq!(status.unstaged[0].path, "file1.txt");
    assert_eq!(status.unstaged[0].status, FileStatus::Modified);
    assert_eq!(status.unstaged[0].is_staged, false);
}
