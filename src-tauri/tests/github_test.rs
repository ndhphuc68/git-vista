mod common;

use common::fixtures::TestRepoFixture;
use visual_git_lib::read::github::{get_github_repo_info, parse_github_remote_url};
use visual_git_lib::write::github_config::{
    get_github_token, remove_github_token, save_github_token,
};
use visual_git_lib::write::remote::add_remote;

/// Point token storage at `path` so tests never touch the real user token, and
/// hide the `gh` CLI for the duration.
///
/// `get_github_token` falls back to `gh auth token` when no file is stored. On a
/// developer machine with the GitHub CLI logged in, that returns a real token
/// where the test expects none — and prints it into the test output. CI passes
/// either way because no `gh` login exists there, which is why this only ever
/// failed locally. `PATH` is restored when the returned guard drops.
fn set_token_path(path: &std::path::Path) -> PathGuard {
    std::env::set_var("GITVISTA_TOKEN_PATH", path);
    let previous = std::env::var_os("PATH");
    std::env::set_var("PATH", "");
    PathGuard(previous)
}

struct PathGuard(Option<std::ffi::OsString>);

impl Drop for PathGuard {
    fn drop(&mut self) {
        match self.0.take() {
            Some(value) => std::env::set_var("PATH", value),
            None => std::env::remove_var("PATH"),
        }
    }
}

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
    // Redirect token storage into a temp file. Without this, the test writes to
    // and then deletes the real user token file at %APPDATA%/gitvista/github_token.
    let temp = tempfile::tempdir().expect("create temp dir");
    let token_path = temp.path().join("github_token");
    let _path_guard = set_token_path(&token_path);

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
