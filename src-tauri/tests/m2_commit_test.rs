mod common;
use common::fixtures::TestRepoFixture;
use std::fs;
use tempfile::TempDir;
use visual_git_lib::error::AppError;
use visual_git_lib::read::status::get_repo_status;
use visual_git_lib::write::commit::create_commit;
use visual_git_lib::write::staging::stage_file;

#[test]
fn test_create_normal_commit_updates_head_and_status() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    let initial_head_id = fixture
        .repo()
        .head()
        .unwrap()
        .peel_to_commit()
        .unwrap()
        .id()
        .to_string();

    // Create a new file and stage it
    fs::write(repo_path.join("new_file.txt"), "committed content\n").unwrap();
    stage_file(repo_path, "new_file.txt").expect("stage should succeed");

    let status_before = get_repo_status(repo_path).unwrap();
    assert_eq!(status_before.staged.len(), 1);

    // Create commit
    let details = create_commit(repo_path, "Add new_file.txt", None, false)
        .expect("create_commit should succeed");

    assert_eq!(details.full_message, "Add new_file.txt");
    assert_eq!(details.parent_ids, vec![initial_head_id]);
    assert_eq!(details.files.len(), 1);
    assert_eq!(details.files[0].path, "new_file.txt");
    assert_eq!(details.files[0].status, "added");

    // Verify HEAD points to new commit
    let current_head_id = fixture
        .repo()
        .head()
        .unwrap()
        .peel_to_commit()
        .unwrap()
        .id()
        .to_string();
    assert_eq!(current_head_id, details.id);

    // Verify staged files are cleared from status
    let status_after = get_repo_status(repo_path).unwrap();
    assert_eq!(status_after.staged.len(), 0);
    assert_eq!(status_after.unstaged.len(), 0);
}

#[test]
fn test_create_commit_with_multiline_description() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    fs::write(repo_path.join("file1.txt"), "updated content\n").unwrap();
    stage_file(repo_path, "file1.txt").expect("stage should succeed");

    let details = create_commit(
        repo_path,
        "  feat: update file1  ",
        Some("  Detailed explanation of the change.\nSecond line of explanation.  "),
        false,
    )
    .expect("commit with description should succeed");

    assert_eq!(
        details.full_message,
        "feat: update file1\n\nDetailed explanation of the change.\nSecond line of explanation."
    );
}

#[test]
fn test_create_commit_whitespace_only_description() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    fs::write(repo_path.join("file1.txt"), "updated again\n").unwrap();
    stage_file(repo_path, "file1.txt").expect("stage should succeed");

    let details = create_commit(
        repo_path,
        "summary only",
        Some("   \t  \n  "),
        false,
    )
    .expect("commit should succeed");

    assert_eq!(details.full_message, "summary only");
}

#[test]
fn test_create_commit_empty_summary_errors() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    let err1 = create_commit(repo_path, "", None, false).unwrap_err();
    match err1 {
        AppError::InvalidOperation(msg) => {
            assert!(msg.contains("Commit summary cannot be empty"));
        }
        other => panic!("Expected InvalidOperation error, got: {:?}", other),
    }

    let err2 = create_commit(repo_path, "   \t\n  ", Some("Some desc"), false).unwrap_err();
    match err2 {
        AppError::InvalidOperation(msg) => {
            assert!(msg.contains("Commit summary cannot be empty"));
        }
        other => panic!("Expected InvalidOperation error, got: {:?}", other),
    }
}

#[test]
fn test_amend_commit_with_backup_ref() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    let initial_commit = fixture.repo().head().unwrap().peel_to_commit().unwrap();
    let initial_id = initial_commit.id();
    let initial_parents: Vec<String> = initial_commit
        .parent_ids()
        .map(|id| id.to_string())
        .collect();

    // Stage a new change
    fs::write(repo_path.join("file1.txt"), "amended content\n").unwrap();
    stage_file(repo_path, "file1.txt").expect("stage should succeed");

    // Perform amend commit
    let details = create_commit(
        repo_path,
        "Amended commit message",
        Some("Amended body"),
        true,
    )
    .expect("amend commit should succeed");

    assert_ne!(details.id, initial_id.to_string());
    assert_eq!(details.full_message, "Amended commit message\n\nAmended body");
    assert_eq!(details.parent_ids, initial_parents);

    // Verify HEAD is updated to amended commit
    let current_head_id = fixture
        .repo()
        .head()
        .unwrap()
        .peel_to_commit()
        .unwrap()
        .id()
        .to_string();
    assert_eq!(current_head_id, details.id);

    // Verify backup ref was created pointing to initial_id
    let repo = fixture.repo();
    let mut backup_refs = Vec::new();
    for r in repo.references().unwrap() {
        let reference = r.unwrap();
        if let Ok(name) = reference.name() {
            if name.starts_with("refs/gitui-backup/amend-") {
                backup_refs.push((name.to_string(), reference.target().unwrap()));
            }
        }
    }

    assert_eq!(backup_refs.len(), 1, "Expected exactly 1 amend backup ref");
    assert_eq!(backup_refs[0].1, initial_id, "Backup ref must point to original commit");

    // Staged status should now be clean
    let status = get_repo_status(repo_path).unwrap();
    assert_eq!(status.staged.len(), 0);
}

#[test]
fn test_create_commit_unborn_head() {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Tester").unwrap();
    config.set_str("user.email", "tester@visualgit.dev").unwrap();

    let file_path = dir.path().join("root.txt");
    fs::write(&file_path, "root content\n").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("root.txt")).unwrap();
    index.write().unwrap();

    let details = create_commit(dir.path(), "Initial root commit", None, false)
        .expect("commit on unborn head should succeed");

    assert_eq!(details.full_message, "Initial root commit");
    assert!(details.parent_ids.is_empty(), "Initial commit should have no parents");

    let head_commit = repo.head().unwrap().peel_to_commit().unwrap();
    assert_eq!(head_commit.id().to_string(), details.id);
}

#[test]
fn test_create_commit_missing_signature_error() {
    let dir = TempDir::new().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    // Overriding user.name to empty string triggers missing/empty config error in libgit2
    config.set_str("user.name", "").unwrap();

    let file_path = dir.path().join("root.txt");
    fs::write(&file_path, "root content\n").unwrap();

    let mut index = repo.index().unwrap();
    index.add_path(std::path::Path::new("root.txt")).unwrap();
    index.write().unwrap();

    let res = create_commit(dir.path(), "Initial root commit", None, false);
    match res {
        Err(AppError::InvalidOperation(msg)) => {
            assert_eq!(msg, "Git user.name or user.email not configured");
        }
        other => panic!("Expected InvalidOperation for missing signature, got: {:?}", other),
    }
}
