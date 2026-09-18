mod common;

use common::fixtures::create_repo_with_commits;
use visual_git_lib::commands::get_commit_graph;

#[test]
fn test_get_commit_graph_layout_and_pagination() {
    let (dir, _repo) = create_repo_with_commits(25).expect("Failed to create repo with 25 commits");
    let path_str = dir.path().to_str().unwrap().to_string();

    let page1 = get_commit_graph(path_str.clone(), 0, 10).expect("Failed to fetch graph page 1");
    assert_eq!(page1.commits.len(), 10);
    assert!(page1.has_more);
    assert_eq!(page1.total_count, 25);

    // Each node has short_id of 7 characters and a column assigned
    for node in &page1.commits {
        assert_eq!(node.short_id.len(), 7);
        assert!(!node.summary.is_empty());
        assert!(!node.author_name.is_empty());
    }

    let page3 = get_commit_graph(path_str, 20, 10).expect("Failed to fetch graph page 3");
    assert_eq!(page3.commits.len(), 5);
    assert!(!page3.has_more);
}

#[test]
fn test_get_commit_graph_merge_topology() {
    use common::fixtures::create_clean_repo;
    use std::fs;
    use std::path::Path;

    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let target_main = dir.path().join("main.txt");
    let target_feat = dir.path().join("feat.txt");

    // Commit 1 is initial commit created by create_clean_repo
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();

    // Commit 2 on master
    fs::write(&target_main, "line 1\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("main.txt")).unwrap();
    idx.write().unwrap();
    let c2_oid = idx.write_tree().unwrap();
    let tree2 = repo.find_tree(c2_oid).unwrap();
    let sig = repo.signature().unwrap();
    let c2 = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            "commit 2 on master",
            &tree2,
            &[&c1],
        )
        .unwrap();
    let c2_commit = repo.find_commit(c2).unwrap();

    // Branch feature from c2
    let mut feature_branch = repo.branch("feature", &c2_commit, false).unwrap();

    // Commit 3 on feature
    fs::write(&target_feat, "feat 1\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("feat.txt")).unwrap();
    idx.write().unwrap();
    let c3_oid = idx.write_tree().unwrap();
    let tree3 = repo.find_tree(c3_oid).unwrap();
    let c3 = repo
        .commit(
            feature_branch.get_mut().name().ok(),
            &sig,
            &sig,
            "commit 3 on feature",
            &tree3,
            &[&c2_commit],
        )
        .unwrap();
    let c3_commit = repo.find_commit(c3).unwrap();

    // Commit 4 on master
    fs::write(&target_main, "line 1\nline 2\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("main.txt")).unwrap();
    idx.write().unwrap();
    let c4_oid = idx.write_tree().unwrap();
    let tree4 = repo.find_tree(c4_oid).unwrap();
    let c4 = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            "commit 4 on master",
            &tree4,
            &[&c2_commit],
        )
        .unwrap();
    let c4_commit = repo.find_commit(c4).unwrap();

    // Commit 5: Merge commit on master with parents c4 and c3
    fs::write(&target_main, "line 1\nline 2\nline 3 merge\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("main.txt")).unwrap();
    idx.write().unwrap();
    let c5_oid = idx.write_tree().unwrap();
    let tree5 = repo.find_tree(c5_oid).unwrap();
    let _c5 = repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            "commit 5 merge",
            &tree5,
            &[&c4_commit, &c3_commit],
        )
        .unwrap();

    let path_str = dir.path().to_str().unwrap().to_string();
    let result = get_commit_graph(path_str, 0, 10).expect("Failed to fetch graph");
    assert_eq!(result.commits.len(), 5);

    // There should be a merge edge present where feature branch converged
    let has_merge_edge = result
        .commits
        .iter()
        .any(|node| node.lines.iter().any(|line| line.edge_type == "merge"));
    assert!(
        has_merge_edge,
        "Expected at least one merge edge when converging branches"
    );

    // Root commit (c1) must not have zombie lines passing through
    let root_node = result.commits.last().unwrap();
    assert_eq!(
        root_node.lines.len(),
        0,
        "Root commit must have no forward/pass-through lines"
    );
}
