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

