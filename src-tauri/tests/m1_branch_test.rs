mod common;

use common::fixtures::create_conflict_repo;
use visual_git_lib::commands::get_branches;

#[test]
fn test_get_branches_lists_local_and_head() {
    let (dir, _repo) = create_conflict_repo().expect("Failed to create conflict repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let result = get_branches(path_str).expect("Failed to get branches");
    assert!(!result.local.is_empty());
    assert!(result.local.iter().any(|b| b.name == "master" || b.name == "main"));
    assert!(result.local.iter().any(|b| b.name == "feature-branch"));

    let head_branch = result.local.iter().find(|b| b.is_head);
    assert!(head_branch.is_some());
}
