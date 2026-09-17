mod common;

use common::fixtures::{create_clean_repo, test_signature};
use std::fs;
use std::path::Path;
use visual_git_lib::read::{get_repo_commit_graph, list_repo_tags};

#[test]
fn test_list_repo_tags_empty_repo() {
    let temp_dir = tempfile::TempDir::new().expect("Failed to create temp dir");
    let _repo = git2::Repository::init(temp_dir.path()).expect("Failed to init repo");

    let tags = list_repo_tags(temp_dir.path()).expect("Failed to list tags in empty repo");
    assert!(tags.is_empty());
}

#[test]
fn test_list_repo_tags_lightweight_and_annotated() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();
    let c1_obj = c1.as_object();

    // Create annotated tag on c1 with earlier timestamp
    let sig_tag = git2::Signature::new(
        "Tester",
        "tester@visualgit.dev",
        &git2::Time::new(1_000_000, 0),
    )
    .unwrap();
    repo.tag(
        "v1.0.0",
        c1_obj,
        &sig_tag,
        "Release v1.0.0",
        false,
    )
    .expect("Failed to create annotated tag");

    // Add a second commit with later timestamp
    let file2 = dir.path().join("file2.txt");
    fs::write(&file2, "second commit content\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("file2.txt")).unwrap();
    let tree2_id = idx.write_tree().unwrap();
    let tree2 = repo.find_tree(tree2_id).unwrap();
    let sig_c2 = git2::Signature::new(
        "Tester",
        "tester@visualgit.dev",
        &git2::Time::new(2_000_000, 0),
    )
    .unwrap();
    let c2_oid = repo
        .commit(
            Some("HEAD"),
            &sig_c2,
            &sig_c2,
            "Second commit",
            &tree2,
            &[&c1],
        )
        .expect("Failed to commit");
    let c2 = repo.find_commit(c2_oid).unwrap();
    let c2_obj = c2.as_object();

    // Create lightweight tag on c2
    repo.tag_lightweight("v2.0.0-lw", c2_obj, false)
        .expect("Failed to create lightweight tag");

    let tags = list_repo_tags(dir.path()).expect("Failed to list tags");
    assert_eq!(tags.len(), 2);

    // Sorted descending by timestamp_sec: c2 / lightweight tag is newer than c1 tag
    let newest = &tags[0];
    let older = &tags[1];

    assert_eq!(newest.name, "v2.0.0-lw");
    assert_eq!(newest.target_commit_id, c2.id().to_string());
    assert_eq!(newest.short_commit_id, c2.id().to_string()[..7]);
    assert_eq!(newest.commit_summary, "Second commit");
    assert!(!newest.is_annotated);
    assert_eq!(newest.message, None);
    assert_eq!(newest.tagger_name, None);
    assert_eq!(newest.tagger_email, None);
    assert_eq!(newest.timestamp_sec, Some(c2.time().seconds() as f64));

    assert_eq!(older.name, "v1.0.0");
    assert_eq!(older.target_commit_id, c1.id().to_string());
    assert_eq!(older.short_commit_id, c1.id().to_string()[..7]);
    assert_eq!(older.commit_summary, "Initial commit");
    assert!(older.is_annotated);
    assert!(older.message.as_deref().unwrap().starts_with("Release v1.0.0"));
    assert_eq!(older.tagger_name.as_deref(), Some("Tester"));
    assert_eq!(older.tagger_email.as_deref(), Some("tester@visualgit.dev"));
    assert!(older.timestamp_sec.is_some());
}

#[test]
fn test_graph_peels_annotated_tags() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();
    let c1_obj = c1.as_object();

    let sig = test_signature();
    repo.tag(
        "v1.0.0-annotated",
        c1_obj,
        &sig,
        "Annotated tag for v1.0.0",
        false,
    )
    .expect("Failed to create annotated tag");

    repo.tag_lightweight("v1.0.0-lw", c1_obj, false)
        .expect("Failed to create lightweight tag");

    let graph = get_repo_commit_graph(dir.path(), 0, 10).expect("Failed to get commit graph");
    assert_eq!(graph.commits.len(), 1);

    let node = &graph.commits[0];
    assert_eq!(node.id, c1.id().to_string());

    let annotated_badge = node
        .refs
        .iter()
        .find(|b| b.name == "v1.0.0-annotated" && b.ref_type == "tag");
    assert!(
        annotated_badge.is_some(),
        "Annotated tag badge should be present on commit node"
    );

    let lw_badge = node
        .refs
        .iter()
        .find(|b| b.name == "v1.0.0-lw" && b.ref_type == "tag");
    assert!(
        lw_badge.is_some(),
        "Lightweight tag badge should be present on commit node"
    );
}
