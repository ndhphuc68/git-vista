mod common;

use common::fixtures::TestRepoFixture;
use std::fs;
use tempfile::TempDir;
use visual_git_lib::read::branches::list_repo_branches;
use visual_git_lib::read::get_head_info;

fn create_bare_remote() -> (TempDir, git2::Repository) {
    let dir = TempDir::new().expect("create temp dir for bare remote");
    let repo = git2::Repository::init_bare(dir.path()).expect("init bare repo");
    (dir, repo)
}

#[test]
fn test_ahead_behind_calculation() {
    let fixture = TestRepoFixture::new();
    let local_path = fixture.path();

    let (remote_dir, _remote_repo) = create_bare_remote();
    let remote_url = remote_dir.path().to_str().unwrap().replace('\\', "/");

    // Add remote "origin" to local repo
    {
        let repo = fixture.repo();
        repo.remote("origin", &remote_url).expect("add remote origin");
    }

    // Push master to origin and set upstream using git CLI
    let push_res = std::process::Command::new("git")
        .current_dir(local_path)
        .args(["push", "-u", "origin", "master"])
        .output()
        .expect("git push -u origin master");
    assert!(push_res.status.success(), "initial push should succeed: {}", String::from_utf8_lossy(&push_res.stderr));

    // Initially ahead = 0, behind = 0
    let head_info = get_head_info(local_path).expect("head info");
    assert_eq!(head_info.ahead, 0);
    assert_eq!(head_info.behind, 0);

    // Commit 1 locally
    fs::write(local_path.join("file1.txt"), "local change 1").unwrap();
    visual_git_lib::write::staging::stage_all(local_path).unwrap();
    visual_git_lib::write::commit::create_commit(local_path, "Local commit 1", None, false).unwrap();

    // Commit 2 locally
    fs::write(local_path.join("file1.txt"), "local change 2").unwrap();
    visual_git_lib::write::staging::stage_all(local_path).unwrap();
    visual_git_lib::write::commit::create_commit(local_path, "Local commit 2", None, false).unwrap();

    // Verify ahead == 2, behind == 0
    let head_info2 = get_head_info(local_path).expect("head info after commits");
    assert_eq!(head_info2.ahead, 2);
    assert_eq!(head_info2.behind, 0);

    let branches = list_repo_branches(local_path).expect("list branches");
    let master_branch = branches.local.iter().find(|b| b.name == "master").expect("find master");
    assert_eq!(master_branch.ahead, 2);
    assert_eq!(master_branch.behind, 0);
}

#[test]
fn test_parse_git_progress_line() {
    use visual_git_lib::exec::parse_git_progress_line;

    let line1 = "Counting objects: 100% (50/50), done.";
    let parsed1 = parse_git_progress_line(line1).expect("parse line1");
    assert_eq!(parsed1.0, 100);
    assert!(parsed1.1.contains("Counting objects"));

    let line2 = "Receiving objects:  45% (450/1000)";
    let parsed2 = parse_git_progress_line(line2).expect("parse line2");
    assert_eq!(parsed2.0, 45);
    assert!(parsed2.1.contains("Receiving objects"));

    let line3 = "Resolving deltas:   5% (5/100)";
    let parsed3 = parse_git_progress_line(line3).expect("parse line3");
    assert_eq!(parsed3.0, 5);
    assert!(parsed3.1.contains("Resolving deltas"));

    let non_progress = "To https://github.com/user/repo.git";
    assert!(parse_git_progress_line(non_progress).is_none());
}

