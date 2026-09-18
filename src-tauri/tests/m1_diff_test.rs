mod common;

use common::fixtures::create_repo_with_commits;
use visual_git_lib::commands::{get_commit_details, get_commit_file_diff, get_commit_graph};

#[test]
fn test_commit_details_and_file_diff() {
    let (dir, _repo) = create_repo_with_commits(3).expect("Failed to create repo");
    let path_str = dir.path().to_str().unwrap().to_string();

    let page = get_commit_graph(path_str.clone(), 0, 1).expect("Failed to fetch head commit");
    let head_commit_id = page.commits[0].id.clone();

    let details = get_commit_details(path_str.clone(), head_commit_id.clone())
        .expect("Failed to get commit details");
    assert_eq!(details.id, head_commit_id);
    assert!(!details.files.is_empty());

    let changed_file = &details.files[0];
    assert!(changed_file.additions > 0);

    let diff = get_commit_file_diff(path_str, head_commit_id, changed_file.path.clone(), None)
        .expect("Failed to get file diff");
    assert_eq!(diff.file_path, changed_file.path);
    assert!(!diff.hunks.is_empty());
    assert!(diff.hunks[0].lines.iter().any(|l| l.line_type == "add"));

    // Verify that hunk header lines (e.g. @@ ... @@) are NOT duplicated into diff lines
    for hunk in &diff.hunks {
        for line in &hunk.lines {
            assert!(
                !line.content.starts_with("@@"),
                "Hunk header line must not be duplicated into diff lines: {}",
                line.content
            );
        }
    }
}
