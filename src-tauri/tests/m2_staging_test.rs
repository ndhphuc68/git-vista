mod common;
use common::fixtures::TestRepoFixture;
use git2::Repository;
use std::fs;
use tempfile::TempDir;
use visual_git_lib::read::status::{get_repo_status, FileStatus};
use visual_git_lib::write::staging::{
    discard_file_changes, stage_all, stage_file, unstage_all, unstage_file,
};

#[test]
fn test_stage_and_unstage_file() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    fs::write(repo_path.join("file1.txt"), "changed content").unwrap();

    // Stage
    stage_file(repo_path, "file1.txt").expect("stage should succeed");
    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.staged[0].path, "file1.txt");
    assert_eq!(status.staged[0].status, FileStatus::Modified);
    assert_eq!(status.unstaged.len(), 0);

    // Unstage
    unstage_file(repo_path, "file1.txt").expect("unstage should succeed");
    let status2 = get_repo_status(repo_path).unwrap();
    assert_eq!(status2.staged.len(), 0);
    assert_eq!(status2.unstaged.len(), 1);
    assert_eq!(status2.unstaged[0].path, "file1.txt");
    assert_eq!(status2.unstaged[0].status, FileStatus::Modified);
}

#[test]
fn test_stage_and_unstage_new_file() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    fs::write(repo_path.join("new_file.txt"), "hello world").unwrap();

    // Untracked at first
    let status_before = get_repo_status(repo_path).unwrap();
    assert_eq!(status_before.untracked.len(), 1);
    assert_eq!(status_before.staged.len(), 0);

    // Stage new file
    stage_file(repo_path, "new_file.txt").expect("stage new file should succeed");
    let status_staged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_staged.staged.len(), 1);
    assert_eq!(status_staged.staged[0].path, "new_file.txt");
    assert_eq!(status_staged.staged[0].status, FileStatus::New);
    assert_eq!(status_staged.untracked.len(), 0);

    // Unstage new file
    unstage_file(repo_path, "new_file.txt").expect("unstage new file should succeed");
    let status_unstaged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_unstaged.staged.len(), 0);
    assert_eq!(status_unstaged.untracked.len(), 1);
    assert_eq!(status_unstaged.untracked[0].path, "new_file.txt");
}

#[test]
fn test_stage_and_unstage_deleted_file() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    fs::remove_file(repo_path.join("file1.txt")).unwrap();

    // Stage deletion
    stage_file(repo_path, "file1.txt").expect("stage deleted file should succeed");
    let status_staged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_staged.staged.len(), 1);
    assert_eq!(status_staged.staged[0].path, "file1.txt");
    assert_eq!(status_staged.staged[0].status, FileStatus::Deleted);
    assert_eq!(status_staged.unstaged.len(), 0);

    // Unstage deletion
    unstage_file(repo_path, "file1.txt").expect("unstage deleted file should succeed");
    let status_unstaged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_unstaged.staged.len(), 0);
    assert_eq!(status_unstaged.unstaged.len(), 1);
    assert_eq!(status_unstaged.unstaged[0].path, "file1.txt");
    assert_eq!(status_unstaged.unstaged[0].status, FileStatus::Deleted);
}

#[test]
fn test_stage_all_and_unstage_all() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // 1 modified, 1 new, 1 deleted
    fs::write(repo_path.join("file1.txt"), "modified file1").unwrap();
    fs::write(repo_path.join("created.txt"), "brand new").unwrap();
    fs::write(repo_path.join("to_delete.txt"), "will delete").unwrap();
    stage_file(repo_path, "to_delete.txt").unwrap();
    {
        // commit to_delete.txt so we can delete it
        let repo = Repository::open(repo_path).unwrap();
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        common::fixtures::commit_index(&repo, "Add to_delete.txt", &[&head]).unwrap();
    }
    fs::remove_file(repo_path.join("to_delete.txt")).unwrap();

    // Stage all
    stage_all(repo_path).expect("stage_all should succeed");
    let status_all_staged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_all_staged.staged.len(), 3);
    assert_eq!(status_all_staged.unstaged.len(), 0);
    assert_eq!(status_all_staged.untracked.len(), 0);

    // Unstage all
    unstage_all(repo_path).expect("unstage_all should succeed");
    let status_all_unstaged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_all_unstaged.staged.len(), 0);
    assert_eq!(status_all_unstaged.unstaged.len(), 2); // file1.txt modified, to_delete.txt deleted
    assert_eq!(status_all_unstaged.untracked.len(), 1); // created.txt untracked
}

#[test]
fn test_discard_file_changes_modified() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let initial_content = fs::read_to_string(repo_path.join("file1.txt")).unwrap();

    fs::write(repo_path.join("file1.txt"), "dirty content").unwrap();
    assert_ne!(
        fs::read_to_string(repo_path.join("file1.txt")).unwrap().replace("\r\n", "\n"),
        initial_content.replace("\r\n", "\n")
    );

    discard_file_changes(repo_path, "file1.txt").expect("discard should succeed");
    assert_eq!(
        fs::read_to_string(repo_path.join("file1.txt")).unwrap().replace("\r\n", "\n"),
        initial_content.replace("\r\n", "\n")
    );

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.unstaged.len(), 0);
}

#[test]
fn test_discard_file_changes_deleted() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let initial_content = fs::read_to_string(repo_path.join("file1.txt")).unwrap();

    fs::remove_file(repo_path.join("file1.txt")).unwrap();
    assert!(!repo_path.join("file1.txt").exists());

    discard_file_changes(repo_path, "file1.txt").expect("discard deleted should restore file");
    assert!(repo_path.join("file1.txt").exists());
    assert_eq!(
        fs::read_to_string(repo_path.join("file1.txt")).unwrap().replace("\r\n", "\n"),
        initial_content.replace("\r\n", "\n")
    );

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.unstaged.len(), 0);
}

#[test]
fn test_unstage_unborn_head() {
    // Test unborn HEAD scenario (empty repo with no commits)
    let dir = TempDir::new().unwrap();
    let repo_path = dir.path();
    git2::Repository::init(repo_path).unwrap();

    fs::write(repo_path.join("initial.txt"), "hello").unwrap();
    stage_file(repo_path, "initial.txt").unwrap();

    // Verify staged
    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);

    // Unstage file on unborn HEAD
    unstage_file(repo_path, "initial.txt").expect("unstage on unborn head should succeed");
    let status_after = get_repo_status(repo_path).unwrap();
    assert_eq!(status_after.staged.len(), 0);
    assert_eq!(status_after.untracked.len(), 1);

    // Stage again and unstage_all on unborn HEAD
    stage_all(repo_path).expect("stage_all should succeed");
    let status_staged_again = get_repo_status(repo_path).unwrap();
    assert_eq!(status_staged_again.staged.len(), 1);

    unstage_all(repo_path).expect("unstage_all on unborn head should succeed");
    let status_after_unstage_all = get_repo_status(repo_path).unwrap();
    assert_eq!(status_after_unstage_all.staged.len(), 0);
    assert_eq!(status_after_unstage_all.untracked.len(), 1);
}

#[test]
fn test_unstage_all_nested_files() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // Create nested file structure
    let nested_dir = repo_path.join("nested").join("dir");
    fs::create_dir_all(&nested_dir).unwrap();
    let nested_file = nested_dir.join("file.txt");
    fs::write(&nested_file, "nested content").unwrap();

    // Also modify a root file
    fs::write(repo_path.join("file1.txt"), "modified root").unwrap();

    // Stage all (including nested file)
    stage_all(repo_path).expect("stage_all should stage nested file");
    let status_staged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_staged.staged.len(), 2);
    assert!(status_staged.staged.iter().any(|item| item.path == "nested/dir/file.txt"));
    assert!(status_staged.staged.iter().any(|item| item.path == "file1.txt"));

    // Unstage all
    unstage_all(repo_path).expect("unstage_all should unstage nested file");
    let status_unstaged = get_repo_status(repo_path).unwrap();
    assert_eq!(status_unstaged.staged.len(), 0);
    assert!(status_unstaged.untracked.iter().any(|item| item.path == "nested/dir/file.txt"));
    assert!(status_unstaged.unstaged.iter().any(|item| item.path == "file1.txt"));
}

