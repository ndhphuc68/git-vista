mod common;

use common::fixtures::create_clean_repo;
use visual_git_lib::commands::{get_recent_repos, open_repository};

#[test]
fn test_open_repository_and_recent_tracking() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let summary = open_repository(path_str.clone()).expect("Failed to open repo");
    assert_eq!(summary.head_branch.as_deref(), Some("master"));
    assert!(!summary.is_bare);
    assert!(summary.head_commit_id.is_some());

    let recents = get_recent_repos().expect("Failed to read recent repos");
    assert!(recents.iter().any(|r| r.path == summary.path));
}

