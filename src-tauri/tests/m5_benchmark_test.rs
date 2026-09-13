use std::time::Instant;
use visual_git_lib::read::graph::get_repo_commit_graph;
use visual_git_lib::read::status::get_repo_status;

fn create_500_commit_repo() -> (tempfile::TempDir, String) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let sig = git2::Signature::now("Benchmarker", "bench@test.com").unwrap();

    let mut parent_id: Option<git2::Oid> = None;

    for i in 0..500 {
        let file_path = dir.path().join(format!("file_{}.txt", i % 10));
        std::fs::write(&file_path, format!("iteration content {}\n", i)).unwrap();

        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new(&format!("file_{}.txt", i % 10))).unwrap();
        let tree_id = index.write_tree().unwrap();
        index.write().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();

        let commit_msg = format!("Commit #{}", i);
        let parents: Vec<git2::Commit> = match parent_id {
            Some(oid) => vec![repo.find_commit(oid).unwrap()],
            None => vec![],
        };
        let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

        let new_id = repo
            .commit(
                Some("HEAD"),
                &sig,
                &sig,
                &commit_msg,
                &tree,
                &parent_refs,
            )
            .unwrap();
        parent_id = Some(new_id);
    }

    let path_str = dir.path().to_str().unwrap().to_string();
    (dir, path_str)
}

#[test]
fn test_benchmark_commit_graph_performance() {
    let (_dir, path) = create_500_commit_repo();

    let start = Instant::now();
    let graph = get_repo_commit_graph(&path, 0, 500).unwrap();
    let duration = start.elapsed();

    println!("⚡ Benchmark: 500-commit graph parsed in {:?}", duration);
    assert_eq!(graph.commits.len(), 500);
    // Budget: Must load under 800ms
    assert!(
        duration.as_millis() < 800,
        "Commit graph loading took {:?}, exceeding 800ms budget!",
        duration
    );
}

#[test]
fn test_benchmark_repo_status_performance() {
    let (_dir, path) = create_500_commit_repo();

    let start = Instant::now();
    let status = get_repo_status(&path).unwrap();
    let duration = start.elapsed();

    println!("⚡ Benchmark: Repo status checked in {:?}", duration);
    // Budget: Must check under 500ms
    assert!(
        duration.as_millis() < 500,
        "Repo status checking took {:?}, exceeding 500ms budget!",
        duration
    );
    assert_eq!(status.staged.len(), 0);
    assert_eq!(status.unstaged.len(), 0);
}
