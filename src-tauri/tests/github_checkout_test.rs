mod common;

use common::fixtures::TestRepoFixture;
use visual_git_lib::error::AppError;
use visual_git_lib::exec::github_checkout::checkout_pull_request;
use std::fs;

#[test]
fn test_checkout_pull_request_rejects_dirty_working_tree() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // Create an uncommitted change in working tree
    let file_path = repo_path.join("dirty_file.txt");
    fs::write(&file_path, "uncommitted changes").expect("write dirty file");

    let res = checkout_pull_request(repo_path, 123);
    assert!(res.is_err());
    match res.unwrap_err() {
        AppError::InvalidOperation(msg) => {
            assert!(msg.contains("commit") || msg.contains("stash") || msg.contains("thay đổi"));
        }
        other => panic!("Expected InvalidOperation for dirty tree, got {:?}", other),
    }
}
