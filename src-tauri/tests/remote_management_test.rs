mod common;

use common::fixtures::TestRepoFixture;
use std::process::Command;
use tempfile::TempDir;
use visual_git_lib::read::remote::get_remotes;
use visual_git_lib::write::remote::{add_remote, remove_remote, rename_remote, set_remote_url};
use visual_git_lib::exec::remote::prune_remote;

fn create_bare_remote() -> (TempDir, git2::Repository) {
    let dir = TempDir::new().expect("create temp dir for bare remote");
    let repo = git2::Repository::init_bare(dir.path()).expect("init bare repo");
    (dir, repo)
}

#[test]
fn test_get_remotes_empty() {
    let fixture = TestRepoFixture::new();
    let remotes = get_remotes(fixture.path()).expect("get_remotes empty repo");
    assert!(remotes.is_empty());
}

#[test]
fn test_remote_crud_lifecycle() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // 1. Add remote "origin"
    let added = add_remote(
        repo_path,
        "origin",
        "https://github.com/owner/repo.git",
    )
    .expect("add remote origin");
    assert_eq!(added.name, "origin");
    assert_eq!(added.fetch_url.as_deref(), Some("https://github.com/owner/repo.git"));
    assert!(added.is_default);

    // Verify list
    let list = get_remotes(repo_path).expect("get_remotes after add");
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].name, "origin");
    assert_eq!(list[0].fetch_url.as_deref(), Some("https://github.com/owner/repo.git"));

    // 2. Set remote URL with custom push URL
    set_remote_url(
        repo_path,
        "origin",
        "https://github.com/owner/renamed-fetch.git",
        Some("https://github.com/owner/renamed-push.git".to_string()),
    )
    .expect("set_remote_url");

    let list2 = get_remotes(repo_path).expect("get_remotes after set_url");
    assert_eq!(list2[0].fetch_url.as_deref(), Some("https://github.com/owner/renamed-fetch.git"));
    assert_eq!(list2[0].push_url.as_deref(), Some("https://github.com/owner/renamed-push.git"));

    // 3. Rename remote from "origin" to "upstream"
    rename_remote(repo_path, "origin", "upstream").expect("rename remote");
    let list3 = get_remotes(repo_path).expect("get_remotes after rename");
    assert_eq!(list3.len(), 1);
    assert_eq!(list3[0].name, "upstream");

    // 4. Remove remote
    remove_remote(repo_path, "upstream").expect("remove remote");
    let list4 = get_remotes(repo_path).expect("get_remotes after remove");
    assert!(list4.is_empty());
}

#[test]
fn test_remote_validation() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // Empty name should fail
    assert!(add_remote(repo_path, "", "https://github.com/test.git").is_err());

    // Flag injection should fail
    assert!(add_remote(repo_path, "--upload-pack", "https://github.com/test.git").is_err());
    assert!(rename_remote(repo_path, "origin", "--invalid").is_err());
    assert!(remove_remote(repo_path, "-f").is_err());
}

#[test]
fn test_prune_stale_remote_branches() {
    // 1. Create bare origin
    let (bare_dir, _) = create_bare_remote();
    let bare_url = bare_dir.path().to_str().unwrap().replace('\\', "/");

    // 2. Create local repo
    let fixture = TestRepoFixture::new();
    let local_path = fixture.path();

    // Add origin
    add_remote(local_path, "origin", &bare_url).expect("add remote origin");

    // Initial push master to origin
    let status1 = Command::new("git")
        .current_dir(local_path)
        .args(["push", "-u", "origin", "master"])
        .output()
        .expect("git push -u origin master");
    assert!(status1.status.success());

    // Create a new branch "stale-feat" and push to origin
    let status2 = Command::new("git")
        .current_dir(local_path)
        .args(["checkout", "-b", "stale-feat"])
        .output()
        .expect("git checkout -b stale-feat");
    assert!(status2.status.success());

    let status3 = Command::new("git")
        .current_dir(local_path)
        .args(["push", "-u", "origin", "stale-feat"])
        .output()
        .expect("git push -u origin stale-feat");
    assert!(status3.status.success());

    // Switch back to master
    let status4 = Command::new("git")
        .current_dir(local_path)
        .args(["checkout", "master"])
        .output()
        .expect("git checkout master");
    assert!(status4.status.success());

    // Verify remote tracking branch origin/stale-feat exists locally
    let branches_before = visual_git_lib::read::branches::list_repo_branches(local_path)
        .expect("list branches before prune");
    assert!(
        branches_before
            .remote
            .iter()
            .any(|b| b.name == "origin/stale-feat"),
        "origin/stale-feat should exist before prune"
    );

    // 3. Delete branch "stale-feat" directly on bare remote
    let status5 = Command::new("git")
        .current_dir(bare_dir.path())
        .args(["branch", "-D", "stale-feat"])
        .output()
        .expect("git branch -D stale-feat on bare remote");
    assert!(status5.status.success());

    // 4. Run prune_remote
    let prune_res = prune_remote(local_path, "origin", "test-prune-task", |_, _| {})
        .expect("prune_remote");

    // Check prune result
    assert!(
        prune_res.pruned_branches.iter().any(|b| b.contains("stale-feat")),
        "prune_res should contain stale-feat, got: {:?}",
        prune_res.pruned_branches
    );

    // Verify remote tracking branch origin/stale-feat is now gone locally
    let branches_after = visual_git_lib::read::branches::list_repo_branches(local_path)
        .expect("list branches after prune");
    assert!(
        !branches_after
            .remote
            .iter()
            .any(|b| b.name == "origin/stale-feat"),
        "origin/stale-feat should NOT exist after prune"
    );
}
