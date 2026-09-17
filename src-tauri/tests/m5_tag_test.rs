mod common;

use common::fixtures::{create_clean_repo, test_signature};
use std::fs;
use std::path::Path;
use visual_git_lib::error::AppError;
use visual_git_lib::read::{get_repo_commit_graph, list_repo_tags};
use visual_git_lib::write::{checkout_tag, create_tag, delete_tag};

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

#[test]
fn test_create_tag_lightweight_and_annotated_validation() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();
    let c1_oid = c1.id().to_string();

    // 1. Validation: empty name
    let err_empty = create_tag(dir.path(), "", &c1_oid, None).unwrap_err();
    assert!(matches!(err_empty, AppError::InvalidOperation(msg) if msg.contains("empty")));

    // 2. Validation: whitespace only name
    let err_ws = create_tag(dir.path(), "   ", &c1_oid, None).unwrap_err();
    assert!(matches!(err_ws, AppError::InvalidOperation(msg) if msg.contains("empty")));

    // 3. Validation: starts with '-'
    let err_dash = create_tag(dir.path(), "-v1.0.0", &c1_oid, None).unwrap_err();
    assert!(matches!(err_dash, AppError::InvalidOperation(msg) if msg.contains("'-'")));

    // 4. Validation: invalid ref name characters
    let err_invalid = create_tag(dir.path(), "tag with spaces", &c1_oid, None).unwrap_err();
    assert!(matches!(err_invalid, AppError::InvalidOperation(msg) if msg.contains("Invalid tag name")));

    // 5. Validation: invalid commit OID
    let err_oid = create_tag(dir.path(), "valid-tag", "not-a-valid-oid", None).unwrap_err();
    assert!(matches!(err_oid, AppError::Git(msg) if msg.contains("Invalid commit OID")));

    // 6. Create lightweight tag
    create_tag(dir.path(), "v1.0.0-lw", &c1_oid, None).expect("Failed to create lightweight tag");
    let lw_ref = repo
        .find_reference("refs/tags/v1.0.0-lw")
        .expect("Lightweight tag ref should exist");
    assert_eq!(lw_ref.peel_to_commit().unwrap().id(), c1.id());

    // 7. Create annotated tag
    create_tag(
        dir.path(),
        "v1.0.0-annotated",
        &c1_oid,
        Some("Release candidate 1.0.0"),
    )
    .expect("Failed to create annotated tag");
    let ann_ref = repo
        .find_reference("refs/tags/v1.0.0-annotated")
        .expect("Annotated tag ref should exist");
    assert_eq!(ann_ref.peel_to_commit().unwrap().id(), c1.id());
    let tag_obj = ann_ref
        .peel(git2::ObjectType::Tag)
        .expect("Should peel to git2 Tag object");
    let tag = tag_obj.as_tag().expect("Target object should be a Tag");
    assert_eq!(tag.message(), Ok(Some("Release candidate 1.0.0")));
    assert_eq!(tag.target_id(), c1.id());
}

#[test]
fn test_checkout_tag_detached_head() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();
    let c1_oid = c1.id().to_string();

    // Create tag on c1
    create_tag(dir.path(), "v1.0.0", &c1_oid, None).expect("Failed to create tag");

    // Add a second commit so HEAD is ahead of the tag
    let file2 = dir.path().join("file2.txt");
    fs::write(&file2, "second commit\n").unwrap();
    let mut idx = repo.index().unwrap();
    idx.add_path(Path::new("file2.txt")).unwrap();
    let tree2_id = idx.write_tree().unwrap();
    let tree2 = repo.find_tree(tree2_id).unwrap();
    let sig = test_signature();
    let c2_oid = repo
        .commit(Some("HEAD"), &sig, &sig, "Second commit", &tree2, &[&c1])
        .expect("Failed to commit");

    // Repo is initially on branch, not detached
    assert!(!repo.head_detached().unwrap());
    assert_eq!(repo.head().unwrap().peel_to_commit().unwrap().id(), c2_oid);

    // Checkout the tag
    checkout_tag(dir.path(), "v1.0.0").expect("Failed to checkout tag");

    // HEAD should now be detached pointing to c1
    assert!(repo.head_detached().unwrap());
    let current_head = repo.head().unwrap().peel_to_commit().unwrap();
    assert_eq!(current_head.id(), c1.id());
}

#[test]
fn test_delete_tag_local() {
    let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
    let c1 = repo.head().unwrap().peel_to_commit().unwrap();
    let c1_oid = c1.id().to_string();

    // 1. Validation: empty tag name
    let err_empty = delete_tag(dir.path(), "", false).unwrap_err();
    assert!(matches!(err_empty, AppError::InvalidOperation(_)));

    // 2. Create tag
    create_tag(dir.path(), "v1.0.0-to-delete", &c1_oid, None).expect("Failed to create tag");
    assert!(repo.find_reference("refs/tags/v1.0.0-to-delete").is_ok());

    // 3. Delete tag locally (delete_remote: false)
    delete_tag(dir.path(), "v1.0.0-to-delete", false).expect("Failed to delete tag");

    // 4. Verify ref is deleted
    assert!(repo.find_reference("refs/tags/v1.0.0-to-delete").is_err());
}
