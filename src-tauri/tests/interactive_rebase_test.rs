mod common;

use common::fixtures::create_repo_with_commits;
use visual_git_lib::exec::rebase::execute_interactive_rebase;
use visual_git_lib::read::rebase::{get_rebase_commits, RebaseActionKind, RebasePlanStep};
use visual_git_lib::write::undo::undo_recorded_commit;

#[test]
fn test_get_rebase_commits_ordering() {
    // Creates repo with 4 commits: Initial commit, Commit #1, Commit #2, Commit #3
    let (dir, repo) = create_repo_with_commits(4).expect("create repo with 4 commits");
    let repo_path = dir.path();

    let mut revwalk = repo.revwalk().unwrap();
    revwalk.push_head().unwrap();
    let all_oids: Vec<git2::Oid> = revwalk.collect::<Result<Vec<_>, _>>().unwrap();
    // all_oids is in reverse chronological order: [C3, C2, C1, Initial]
    assert_eq!(all_oids.len(), 4);
    let base_oid = all_oids[3]; // Initial commit

    let commits = get_rebase_commits(repo_path, &base_oid.to_string()).expect("get_rebase_commits");
    assert_eq!(commits.len(), 3);
    // Chronological order: [C1, C2, C3]
    assert_eq!(commits[0].id, all_oids[2].to_string());
    assert_eq!(commits[1].id, all_oids[1].to_string());
    assert_eq!(commits[2].id, all_oids[0].to_string());
}

#[test]
fn test_interactive_rebase_reorder_and_drop() {
    let (dir, repo) = create_repo_with_commits(4).expect("create repo with 4 commits");
    let repo_path = dir.path();

    let mut revwalk = repo.revwalk().unwrap();
    revwalk.push_head().unwrap();
    let all_oids: Vec<git2::Oid> = revwalk.collect::<Result<Vec<_>, _>>().unwrap();
    let base_oid = all_oids[3];
    let c1_oid = all_oids[2].to_string();
    let c2_oid = all_oids[1].to_string();
    let c3_oid = all_oids[0].to_string();

    // Plan: Swap c2 and c1, and drop c3
    let steps = vec![
        RebasePlanStep {
            commit_id: c2_oid.clone(),
            action: RebaseActionKind::Pick,
            new_message: None,
        },
        RebasePlanStep {
            commit_id: c1_oid.clone(),
            action: RebaseActionKind::Pick,
            new_message: None,
        },
        RebasePlanStep {
            commit_id: c3_oid.clone(),
            action: RebaseActionKind::Drop,
            new_message: None,
        },
    ];

    let result = execute_interactive_rebase(repo_path, &base_oid.to_string(), steps, false)
        .expect("execute_interactive_rebase");

    assert!(result.success);
    assert_eq!(result.status, "Success");

    // Check resulting commits
    let fresh_repo = git2::Repository::open(repo_path).unwrap();
    let mut fresh_walk = fresh_repo.revwalk().unwrap();
    fresh_walk.push_head().unwrap();
    let resulting_oids: Vec<git2::Oid> = fresh_walk.collect::<Result<Vec<_>, _>>().unwrap();

    // Now there should be 3 commits: [New_C1, New_C2, Initial] (C3 was dropped)
    assert_eq!(resulting_oids.len(), 3);
    let new_head = fresh_repo.find_commit(resulting_oids[0]).unwrap();
    assert!(new_head.summary().ok().flatten().unwrap().contains("Commit #1")); // C1 was placed second (so it's on top)
    let parent = new_head.parent(0).unwrap();
    assert!(parent.summary().ok().flatten().unwrap().contains("Commit #2")); // C2 was placed first
    assert_eq!(parent.parent(0).unwrap().id(), base_oid);
}

#[test]
fn test_interactive_rebase_reword() {
    let (dir, repo) = create_repo_with_commits(3).expect("create repo with 3 commits");
    let repo_path = dir.path();

    let mut revwalk = repo.revwalk().unwrap();
    revwalk.push_head().unwrap();
    let all_oids: Vec<git2::Oid> = revwalk.collect::<Result<Vec<_>, _>>().unwrap();
    let base_oid = all_oids[2];
    let c1_oid = all_oids[1].to_string();
    let c2_oid = all_oids[0].to_string();

    let new_c1_msg = "Reworded Commit #1 Summary\n\nDetailed new body line for commit 1.";
    let steps = vec![
        RebasePlanStep {
            commit_id: c1_oid.clone(),
            action: RebaseActionKind::Reword,
            new_message: Some(new_c1_msg.to_string()),
        },
        RebasePlanStep {
            commit_id: c2_oid.clone(),
            action: RebaseActionKind::Pick,
            new_message: None,
        },
    ];

    let result = execute_interactive_rebase(repo_path, &base_oid.to_string(), steps, false)
        .expect("execute_interactive_rebase reword");

    assert!(result.success);
    assert_eq!(result.status, "Success");

    let fresh_repo = git2::Repository::open(repo_path).unwrap();
    let head = fresh_repo.head().unwrap().peel_to_commit().unwrap();
    let c1_reworded = head.parent(0).unwrap();
    assert_eq!(c1_reworded.summary().ok().flatten().unwrap(), "Reworded Commit #1 Summary");
    assert!(c1_reworded.message().unwrap().contains("Detailed new body line"));
}

#[test]
fn test_interactive_rebase_squash_fixup() {
    let (dir, repo) = create_repo_with_commits(3).expect("create repo with 3 commits");
    let repo_path = dir.path();

    let mut revwalk = repo.revwalk().unwrap();
    revwalk.push_head().unwrap();
    let all_oids: Vec<git2::Oid> = revwalk.collect::<Result<Vec<_>, _>>().unwrap();
    let base_oid = all_oids[2];
    let c1_oid = all_oids[1].to_string();
    let c2_oid = all_oids[0].to_string();

    let squashed_msg = "Combined Commit 1 and 2";
    let steps = vec![
        RebasePlanStep {
            commit_id: c1_oid.clone(),
            action: RebaseActionKind::Pick,
            new_message: None,
        },
        RebasePlanStep {
            commit_id: c2_oid.clone(),
            action: RebaseActionKind::Squash,
            new_message: Some(squashed_msg.to_string()),
        },
    ];

    let result = execute_interactive_rebase(repo_path, &base_oid.to_string(), steps, false)
        .expect("execute_interactive_rebase squash");

    assert!(result.success);
    assert_eq!(result.status, "Success");

    let fresh_repo = git2::Repository::open(repo_path).unwrap();
    let mut fresh_walk = fresh_repo.revwalk().unwrap();
    fresh_walk.push_head().unwrap();
    let resulting_oids: Vec<git2::Oid> = fresh_walk.collect::<Result<Vec<_>, _>>().unwrap();

    // Head is the combined commit, parent is base -> total 2 commits in repo
    assert_eq!(resulting_oids.len(), 2);
    let head = fresh_repo.head().unwrap().peel_to_commit().unwrap();
    assert_eq!(head.summary().ok().flatten().unwrap(), "Combined Commit 1 and 2");
    assert_eq!(head.parent(0).unwrap().id(), base_oid);

    // Both files exist in the tree of head
    let tree = head.tree().unwrap();
    assert!(tree.get_name("file_1.txt").is_some());
    assert!(tree.get_name("file_2.txt").is_some());
}

#[test]
fn test_interactive_rebase_safety_backup_and_undo() {
    let (dir, repo) = create_repo_with_commits(3).expect("create repo with 3 commits");
    let repo_path = dir.path();

    let pre_head_oid = repo.head().unwrap().peel_to_commit().unwrap().id();

    let mut revwalk = repo.revwalk().unwrap();
    revwalk.push_head().unwrap();
    let all_oids: Vec<git2::Oid> = revwalk.collect::<Result<Vec<_>, _>>().unwrap();
    let base_oid = all_oids[2];
    let c1_oid = all_oids[1].to_string();

    // Drop c2, keeping only c1
    let steps = vec![
        RebasePlanStep {
            commit_id: c1_oid.clone(),
            action: RebaseActionKind::Pick,
            new_message: None,
        },
        RebasePlanStep {
            commit_id: all_oids[0].to_string(),
            action: RebaseActionKind::Drop,
            new_message: None,
        },
    ];

    let result = execute_interactive_rebase(repo_path, &base_oid.to_string(), steps, false)
        .expect("execute_interactive_rebase");

    assert!(result.success);
    let token = result.undo_token.expect("undo_token must be present");
    assert!(token.starts_with("refs/gitui-backup/commit-undo-"));

    // Verify HEAD changed
    let fresh_repo = git2::Repository::open(repo_path).unwrap();
    let post_head_oid = fresh_repo.head().unwrap().peel_to_commit().unwrap().id();
    assert_ne!(post_head_oid, pre_head_oid);

    // Call undo_recorded_commit with the token
    undo_recorded_commit(repo_path, &token).expect("undo_recorded_commit succeeds");

    // HEAD must be restored to original pre-rebase HEAD!
    let restored_repo = git2::Repository::open(repo_path).unwrap();
    let restored_head_oid = restored_repo.head().unwrap().peel_to_commit().unwrap().id();
    assert_eq!(restored_head_oid, pre_head_oid);
}
