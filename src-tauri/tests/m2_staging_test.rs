mod common;
use common::fixtures::TestRepoFixture;
use git2::Repository;
use std::fs;
use tempfile::TempDir;
use visual_git_lib::read::status::{get_repo_status, FileStatus};
use visual_git_lib::write::staging::{
    discard_file_changes, stage_all, stage_file, stage_hunk, stage_lines, unstage_all,
    unstage_file,
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

#[test]
fn test_stage_single_hunk() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    // Create a file with two distinct hunks separated by 20 lines of context
    let mut content = String::from("top hunk line 1\n");
    for i in 0..20 {
        content.push_str(&format!("context line {}\n", i));
    }
    content.push_str("bottom hunk line 1\n");
    fs::write(repo_path.join("file1.txt"), &content).unwrap();

    // Commit initial state
    let repo = Repository::open(repo_path).unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file1.txt")).unwrap();
    index.write().unwrap();
    common::fixtures::commit_index(&repo, "Commit initial file1.txt", &[&head]).unwrap();

    // Modify both hunks
    let modified = content
        .replace("top hunk line 1", "TOP MODIFIED")
        .replace("bottom hunk line 1", "BOTTOM MODIFIED");
    fs::write(repo_path.join("file1.txt"), modified).unwrap();

    // Stage only hunk 0
    stage_hunk(repo_path, "file1.txt", 0, false).expect("stage hunk 0");

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.unstaged.len(), 1); // still has hunk 1 unstaged!

    // Verify staged diff has only hunk 0 (TOP MODIFIED)
    let staged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "file1.txt", true, None).unwrap();
    assert_eq!(staged_diff.hunks.len(), 1);
    assert!(staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("TOP MODIFIED")));
    assert!(!staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("BOTTOM MODIFIED")));

    // Verify unstaged diff has only hunk 1 (BOTTOM MODIFIED)
    let unstaged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "file1.txt", false, None).unwrap();
    assert_eq!(unstaged_diff.hunks.len(), 1);
    assert!(unstaged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("BOTTOM MODIFIED")));
    assert!(!unstaged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("TOP MODIFIED")));
}

#[test]
fn test_unstage_single_hunk() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let mut content = String::from("top hunk line 1\n");
    for i in 0..20 {
        content.push_str(&format!("context line {}\n", i));
    }
    content.push_str("bottom hunk line 1\n");
    fs::write(repo_path.join("file1.txt"), &content).unwrap();

    let repo = Repository::open(repo_path).unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("file1.txt")).unwrap();
    index.write().unwrap();
    common::fixtures::commit_index(&repo, "Commit initial file1.txt", &[&head]).unwrap();

    // Modify both hunks and stage all
    let modified = content
        .replace("top hunk line 1", "TOP MODIFIED")
        .replace("bottom hunk line 1", "BOTTOM MODIFIED");
    fs::write(repo_path.join("file1.txt"), modified).unwrap();
    stage_file(repo_path, "file1.txt").unwrap();

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.unstaged.len(), 0);

    // Unstage hunk 0 (is_staged = true)
    stage_hunk(repo_path, "file1.txt", 0, true).expect("unstage hunk 0");

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.unstaged.len(), 1);

    // Staged diff should only have BOTTOM MODIFIED
    let staged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "file1.txt", true, None).unwrap();
    assert_eq!(staged_diff.hunks.len(), 1);
    assert!(staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("BOTTOM MODIFIED")));
    assert!(!staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("TOP MODIFIED")));

    // Unstaged diff should only have TOP MODIFIED
    let unstaged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "file1.txt", false, None).unwrap();
    assert_eq!(unstaged_diff.hunks.len(), 1);
    assert!(unstaged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("TOP MODIFIED")));
    assert!(!unstaged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.contains("BOTTOM MODIFIED")));
}

#[test]
fn test_stage_lines() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let content = "header\nfooter\n";
    fs::write(repo_path.join("lines.txt"), content).unwrap();

    let repo = Repository::open(repo_path).unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("lines.txt")).unwrap();
    index.write().unwrap();
    common::fixtures::commit_index(&repo, "Commit initial lines.txt", &[&head]).unwrap();

    // Modify file: add line A and line B between header and footer
    let modified = "header\nline A\nline B\nfooter\n";
    fs::write(repo_path.join("lines.txt"), modified).unwrap();

    // In unstaged diff:
    // header (idx 0, context)
    // line A (idx 1, add)
    // line B (idx 2, add)
    // footer (idx 3, context)
    let unstaged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", false, None).unwrap();
    assert_eq!(unstaged_diff.hunks.len(), 1);
    assert_eq!(unstaged_diff.hunks[0].lines.len(), 4);
    assert_eq!(unstaged_diff.hunks[0].lines[1].content.trim(), "line A");
    assert_eq!(unstaged_diff.hunks[0].lines[2].content.trim(), "line B");

    // Stage only line A (index 1)
    stage_lines(repo_path, "lines.txt", 0, &[1], false).expect("stage line A");

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.unstaged.len(), 1);

    // Staged diff should only have line A
    let staged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", true, None).unwrap();
    assert_eq!(staged_diff.hunks.len(), 1);
    assert!(staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.trim() == "line A"));
    assert!(!staged_diff.hunks[0]
        .lines
        .iter()
        .any(|l| l.content.trim() == "line B"));

    // Unstaged diff should now only have line B as added line
    let unstaged_diff_after =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", false, None).unwrap();
    assert_eq!(unstaged_diff_after.hunks.len(), 1);
    assert!(unstaged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line B"));
    assert!(!unstaged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line A"));
}

#[test]
fn test_unstage_lines() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let content = "header\nfooter\n";
    fs::write(repo_path.join("lines.txt"), content).unwrap();

    let repo = Repository::open(repo_path).unwrap();
    let head = repo.head().unwrap().peel_to_commit().unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("lines.txt")).unwrap();
    index.write().unwrap();
    common::fixtures::commit_index(&repo, "Commit initial lines.txt", &[&head]).unwrap();

    // Modify file and stage all
    let modified = "header\nline A\nline B\nfooter\n";
    fs::write(repo_path.join("lines.txt"), modified).unwrap();
    stage_file(repo_path, "lines.txt").unwrap();

    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.unstaged.len(), 0);

    // Staged diff:
    // header (idx 0, context)
    // line A (idx 1, add)
    // line B (idx 2, add)
    // footer (idx 3, context)
    let staged_diff =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", true, None).unwrap();
    assert_eq!(staged_diff.hunks.len(), 1);
    assert_eq!(staged_diff.hunks[0].lines[1].content.trim(), "line A");
    assert_eq!(staged_diff.hunks[0].lines[2].content.trim(), "line B");

    // Unstage only line A (index 1, is_staged = true)
    stage_lines(repo_path, "lines.txt", 0, &[1], true).expect("unstage line A");

    let status_after = get_repo_status(repo_path).unwrap();
    assert_eq!(status_after.staged.len(), 1);
    assert_eq!(status_after.unstaged.len(), 1);

    // Staged diff should only have line B as added line
    let staged_diff_after =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", true, None).unwrap();
    assert_eq!(staged_diff_after.hunks.len(), 1);
    assert!(staged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line B"));
    assert!(!staged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line A"));

    // Unstaged diff should only have line A as added line
    let unstaged_diff_after =
        visual_git_lib::read::status::get_working_file_diff(repo_path, "lines.txt", false, None).unwrap();
    assert_eq!(unstaged_diff_after.hunks.len(), 1);
    assert!(unstaged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line A"));
    assert!(!unstaged_diff_after.hunks[0]
        .lines
        .iter()
        .any(|l| l.line_type == "add" && l.content.trim() == "line B"));
}


