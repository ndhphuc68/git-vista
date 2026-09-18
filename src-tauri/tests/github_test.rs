mod common;

use common::fixtures::TestRepoFixture;
use visual_git_lib::read::github::{get_github_repo_info, parse_github_remote_url};
use visual_git_lib::write::github_config::{
    get_github_token, remove_github_token, save_github_token,
};
use visual_git_lib::write::remote::add_remote;

#[test]
fn test_parse_github_urls() {
    // HTTPS standard with .git
    assert_eq!(
        parse_github_remote_url("https://github.com/facebook/react.git"),
        Some(("facebook".to_string(), "react".to_string()))
    );

    // HTTPS without .git
    assert_eq!(
        parse_github_remote_url("https://github.com/rust-lang/rust"),
        Some(("rust-lang".to_string(), "rust".to_string()))
    );

    // SSH standard
    assert_eq!(
        parse_github_remote_url("git@github.com:tauri-apps/tauri.git"),
        Some(("tauri-apps".to_string(), "tauri".to_string()))
    );

    // SSH without .git
    assert_eq!(
        parse_github_remote_url("git@github.com:ndhphuc68/git-vista"),
        Some(("ndhphuc68".to_string(), "git-vista".to_string()))
    );

    // Non-github URLs
    assert_eq!(
        parse_github_remote_url("https://gitlab.com/gitlab-org/gitlab.git"),
        None
    );
    assert_eq!(
        parse_github_remote_url("https://bitbucket.org/atlassian/repo.git"),
        None
    );
    assert_eq!(parse_github_remote_url("/local/path/to/repo"), None);
}

#[test]
fn test_get_github_repo_info_with_and_without_remote() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // 1. Initially without any remotes
    let info = get_github_repo_info(repo_path).expect("get repo info without remote");
    assert!(!info.is_github);
    assert_eq!(info.owner, None);
    assert_eq!(info.repo, None);

    // 2. Add remote origin pointing to GitHub
    add_remote(
        repo_path,
        "origin",
        "https://github.com/antigravity-ai/git-vista.git",
    )
    .expect("add remote origin");

    let info_with_github = get_github_repo_info(repo_path).expect("get repo info with remote");
    assert!(info_with_github.is_github);
    assert_eq!(info_with_github.owner.as_deref(), Some("antigravity-ai"));
    assert_eq!(info_with_github.repo.as_deref(), Some("git-vista"));
}

#[test]
fn test_github_token_storage_lifecycle() {
    // Save token
    let test_token = "ghp_test_token_1234567890abcdef";
    save_github_token(test_token).expect("save token");

    let loaded = get_github_token().expect("get token");
    assert_eq!(loaded.as_deref(), Some(test_token));

    // Remove token
    remove_github_token().expect("remove token");
    let loaded_after = get_github_token().expect("get token after remove");
    assert_eq!(loaded_after, None);
}
