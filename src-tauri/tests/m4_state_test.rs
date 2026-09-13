use std::fs;
use std::path::Path;
use visual_git_lib::read::state::get_repo_state;

fn create_temp_repo() -> (tempfile::TempDir, git2::Repository) {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let mut config = repo.config().unwrap();
    config.set_str("user.name", "Test User").unwrap();
    config.set_str("user.email", "test@example.com").unwrap();

    let file_path = dir.path().join("base.txt");
    fs::write(&file_path, "base\n").unwrap();
    let mut index = repo.index().unwrap();
    index.add_path(Path::new("base.txt")).unwrap();
    index.write().unwrap();
    let tree_id = index.write_tree().unwrap();
    {
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
            .unwrap();
    }

    (dir, repo)
}

#[test]
fn test_get_repo_state_clean_and_simulated_merge() {
    let (dir, _repo) = create_temp_repo();
    let repo_path = dir.path().to_str().unwrap();

    // 1. Repo vừa tạo phải là clean
    let clean_state = get_repo_state(repo_path).unwrap();
    assert_eq!(clean_state.state, "clean");
    assert!(!clean_state.is_in_progress);
    assert_eq!(clean_state.conflict_count, 0);

    // 2. Tạo file MERGE_HEAD để mô phỏng trạng thái Merge dở dang
    let git_dir = dir.path().join(".git");
    fs::write(
        git_dir.join("MERGE_HEAD"),
        "0123456789abcdef0123456789abcdef01234567\n",
    )
    .unwrap();
    fs::write(git_dir.join("MERGE_MSG"), "Merge branch 'feature'\n").unwrap();

    let merge_state = get_repo_state(repo_path).unwrap();
    assert_eq!(merge_state.state, "merge");
    assert!(merge_state.is_in_progress);
    assert_eq!(merge_state.target_name, Some("feature".to_string()));
}
