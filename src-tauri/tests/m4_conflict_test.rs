use std::fs;
use std::process::Command;
use visual_git_lib::read::conflict::get_conflict_file_data;
use visual_git_lib::read::status::get_repo_status;
use visual_git_lib::write::conflict::resolve_conflict_file;

fn create_conflict_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path();
    let run = |args: &[&str]| {
        let out = Command::new("git").current_dir(p).args(args).output().unwrap();
        assert!(out.status.success(), "git {:?} failed: {}", args, String::from_utf8_lossy(&out.stderr));
    };

    run(&["init"]);
    run(&["config", "user.name", "Tester"]);
    run(&["config", "user.email", "tester@test.com"]);

    fs::write(p.join("app.txt"), "common header\ncommon middle\ncommon footer\n").unwrap();
    run(&["add", "app.txt"]);
    run(&["commit", "-m", "initial"]);
    run(&["branch", "-M", "main"]);

    run(&["checkout", "-b", "feature"]);
    fs::write(p.join("app.txt"), "common header\nfeature line\ncommon footer\n").unwrap();
    run(&["commit", "-am", "feature change"]);

    run(&["checkout", "main"]);
    fs::write(p.join("app.txt"), "common header\nmain line\ncommon footer\n").unwrap();
    run(&["commit", "-am", "main change"]);

    let _ = Command::new("git").current_dir(p).args(["merge", "feature"]).output().unwrap();

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_conflict_parsing_and_resolution_lifecycle() {
    let (_dir, repo_path) = create_conflict_repo();

    // 1. Phân tích conflict file data
    let data = get_conflict_file_data(&repo_path, "app.txt").unwrap();
    assert_eq!(data.file_path, "app.txt");
    assert_eq!(data.total_conflicts, 1);

    let conflict_hunk = data.hunks.iter().find(|h| h.is_conflict).expect("Must have 1 conflict hunk");
    assert!(conflict_hunk.ours.as_ref().unwrap().contains("main line"));
    assert!(conflict_hunk.theirs.as_ref().unwrap().contains("feature line"));

    // 2. Giải quyết conflict và auto-stage
    let resolved = "common header\nmain line\nfeature line\ncommon footer\n";
    resolve_conflict_file(&repo_path, "app.txt", resolved, true).unwrap();

    // 3. Trạng thái repo không còn conflict và file đã staged
    let status = get_repo_status(&repo_path).unwrap();
    assert_eq!(status.conflicted.len(), 0);
    assert!(status.staged.iter().any(|s| s.path == "app.txt"));
}
