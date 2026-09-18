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
        repo.remote("origin", &remote_url)
            .expect("add remote origin");
    }

    // Push master to origin and set upstream using git CLI
    let push_res = std::process::Command::new("git")
        .current_dir(local_path)
        .args(["push", "-u", "origin", "master"])
        .output()
        .expect("git push -u origin master");
    assert!(
        push_res.status.success(),
        "initial push should succeed: {}",
        String::from_utf8_lossy(&push_res.stderr)
    );

    // Initially ahead = 0, behind = 0
    let head_info = get_head_info(local_path).expect("head info");
    assert_eq!(head_info.ahead, 0);
    assert_eq!(head_info.behind, 0);

    // Commit 1 locally
    fs::write(local_path.join("file1.txt"), "local change 1").unwrap();
    visual_git_lib::write::staging::stage_all(local_path).unwrap();
    visual_git_lib::write::commit::create_commit(local_path, "Local commit 1", None, false)
        .unwrap();

    // Commit 2 locally
    fs::write(local_path.join("file1.txt"), "local change 2").unwrap();
    visual_git_lib::write::staging::stage_all(local_path).unwrap();
    visual_git_lib::write::commit::create_commit(local_path, "Local commit 2", None, false)
        .unwrap();

    // Verify ahead == 2, behind == 0
    let head_info2 = get_head_info(local_path).expect("head info after commits");
    assert_eq!(head_info2.ahead, 2);
    assert_eq!(head_info2.behind, 0);

    let branches = list_repo_branches(local_path).expect("list branches");
    let master_branch = branches
        .local
        .iter()
        .find(|b| b.name == "master")
        .expect("find master");
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

#[test]
fn test_remote_operations_lifecycle() {
    use std::sync::{Arc, Mutex};
    use visual_git_lib::exec::remote::{
        git_clone, git_fetch, git_pull, git_push, set_repo_pull_rebase,
    };

    // 1. Create bare origin
    let (bare_dir, _) = create_bare_remote();
    let bare_url = bare_dir.path().to_str().unwrap().replace('\\', "/");

    // 2. Create repo A and push to bare origin
    let repo_a = TestRepoFixture::new();
    let repo_a_path = repo_a.path();
    {
        let repo = repo_a.repo();
        repo.remote("origin", &bare_url).expect("add remote origin");
    }

    let progress_events = Arc::new(Mutex::new(Vec::new()));
    let p_clone = progress_events.clone();
    let push_out = git_push(
        repo_a_path,
        Some("origin"),
        Some("master"),
        true,  // set_upstream
        false, // force
        "task-push-1",
        move |percent, text| {
            p_clone.lock().unwrap().push((percent, text));
        },
    )
    .expect("push master to bare");
    assert!(!push_out.is_empty());

    // 3. Test git_clone: clone bare origin into repo B directory
    let clone_target = TempDir::new().expect("clone tempdir");
    let repo_b_path = clone_target.path().join("cloned_repo");
    let clone_progress = Arc::new(Mutex::new(Vec::new()));
    let c_clone = clone_progress.clone();
    let _clone_out = git_clone(
        &bare_url,
        &repo_b_path,
        "task-clone-1",
        move |percent, text| {
            c_clone.lock().unwrap().push((percent, text));
        },
    )
    .expect("git_clone");
    assert!(repo_b_path.join(".git").exists());

    // 4. Test git_fetch in repo B
    let fetch_progress = Arc::new(Mutex::new(Vec::new()));
    let f_clone = fetch_progress.clone();
    let _fetch_out = git_fetch(
        &repo_b_path,
        Some("origin"),
        true,
        "task-fetch-1",
        move |percent, text| {
            f_clone.lock().unwrap().push((percent, text));
        },
    )
    .expect("git_fetch");

    // 5. Commit a new file in repo A and push
    fs::write(repo_a_path.join("new_file.txt"), "hello from repo A").unwrap();
    visual_git_lib::write::staging::stage_all(repo_a_path).unwrap();
    visual_git_lib::write::commit::create_commit(repo_a_path, "Commit from A", None, false)
        .unwrap();
    git_push(
        repo_a_path,
        Some("origin"),
        Some("master"),
        false,
        false,
        "task-push-2",
        |_, _| {},
    )
    .expect("push commit from A");

    // 6. Test git_pull in repo B
    let pull_progress = Arc::new(Mutex::new(Vec::new()));
    let pl_clone = pull_progress.clone();
    let _pull_out = git_pull(
        &repo_b_path,
        Some("origin"),
        Some("master"),
        Some(false), // no-rebase
        "task-pull-1",
        move |percent, text| {
            pl_clone.lock().unwrap().push((percent, text));
        },
    )
    .expect("git_pull");
    assert!(
        repo_b_path.join("new_file.txt").exists(),
        "new_file.txt should be pulled into repo B"
    );

    // 7. Test set_repo_pull_rebase
    set_repo_pull_rebase(&repo_b_path, true).expect("set pull.rebase true");
    let config = git2::Repository::open(&repo_b_path)
        .unwrap()
        .config()
        .unwrap();
    assert!(config.get_bool("pull.rebase").unwrap());

    set_repo_pull_rebase(&repo_b_path, false).expect("set pull.rebase false");
    let config2 = git2::Repository::open(&repo_b_path)
        .unwrap()
        .config()
        .unwrap();
    assert!(!config2.get_bool("pull.rebase").unwrap());
}

#[test]
fn test_cancel_task_process() {
    use visual_git_lib::exec::{
        cancel_task, is_task_cancelled, register_task_process, unregister_task_process,
    };

    let task_id = "test-cancel-123";
    register_task_process(task_id, 999999);
    assert!(!is_task_cancelled(task_id));

    let cancelled = cancel_task(task_id);
    assert!(is_task_cancelled(task_id));
    assert!(cancelled);

    unregister_task_process(task_id);
    assert!(!is_task_cancelled(task_id));
}
