mod common;

use common::fixtures::{
    create_clean_repo, create_conflict_repo, create_detached_head_repo, create_repo_with_commits,
};
use visual_git_lib::commands::{get_system_info, ping};
use visual_git_lib::read::get_head_info;

#[test]
fn test_ping_command() {
    let response = ping("hello test".to_string());
    assert!(response.contains("Pong từ Rust backend: 'hello test'"));
}

#[test]
fn test_system_info_command() {
    let info = get_system_info().expect("get_system_info failed");
    assert!(!info.os.is_empty());
    assert!(!info.arch.is_empty());
    assert!(!info.app_version.is_empty());
}

#[test]
fn test_fixture_clean_repo() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    assert!(dir.path().exists());
    assert!(!repo.is_empty().unwrap());

    let head_info = get_head_info(dir.path()).expect("Failed to read head info");
    assert!(!head_info.is_detached);
    assert!(head_info.branch_name.is_some());
    assert!(head_info.head_commit_id.is_some());
}

#[test]
fn test_fixture_repo_with_commits() {
    let (_dir, repo) = create_repo_with_commits(10).expect("Failed to create repo with commits");

    let mut revwalk = repo.revwalk().expect("Failed to create revwalk");
    revwalk.push_head().expect("Failed to push head to revwalk");
    let commit_count = revwalk.count();

    assert_eq!(commit_count, 10, "Repo phải có đúng 10 commit");
}

#[test]
fn test_fixture_conflict_repo() {
    let (_dir, repo) = create_conflict_repo().expect("Failed to create conflict repo");

    let index = repo.index().expect("Failed to get repo index");
    assert!(
        index.has_conflicts(),
        "Fixture repo conflict phải có trạng thái index.has_conflicts() == true"
    );
}

#[test]
fn test_fixture_detached_head_repo() {
    let (dir, repo) = create_detached_head_repo().expect("Failed to create detached head repo");
    assert!(repo.head_detached().unwrap(), "Repo phải ở trạng thái detached HEAD");

    let head_info = get_head_info(dir.path()).expect("Failed to read head info");
    assert!(head_info.is_detached);
    assert!(head_info.branch_name.is_none());
    assert!(head_info.head_commit_id.is_some());
}

