mod common;

use common::fixtures::TestRepoFixture;
use std::fs;
use visual_git_lib::write::branch::{checkout_branch, create_branch, validate_branch_name};

#[test]
fn rejects_branch_names_that_git_cli_would_parse_as_options() {
    let fixture = TestRepoFixture::new();

    let error = validate_branch_name("--mirror").unwrap_err();

    assert!(error.to_string().contains("cannot start with '-'"));
    assert!(fixture
        .repo()
        .find_branch("--mirror", git2::BranchType::Local)
        .is_err());
}

#[test]
fn test_create_branch_without_checkout() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    create_branch(repo_path, "feature/new-branch", None, false)
        .expect("create_branch should succeed");

    let repo = fixture.repo();
    let branch = repo
        .find_branch("feature/new-branch", git2::BranchType::Local)
        .expect("branch should exist");
    assert_eq!(branch.name().unwrap().unwrap(), "feature/new-branch");

    // HEAD should still be master (or initial branch)
    let head = repo.head().expect("head should exist");
    assert_ne!(head.shorthand().unwrap(), "feature/new-branch");
}

#[test]
fn test_create_branch_with_checkout() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    create_branch(repo_path, "feature/checkout-branch", None, true)
        .expect("create_branch with checkout should succeed");

    let repo = fixture.repo();
    let head = repo.head().expect("head should exist");
    assert_eq!(head.shorthand().unwrap(), "feature/checkout-branch");
}

#[test]
fn test_safe_checkout_clean_and_conflict() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    // 1. Create a second branch
    create_branch(repo_path, "branch-b", None, false).expect("create branch-b");

    // 2. Modify an unrelated file (uncommitted dirty working tree, no conflict)
    let unrelated_path = repo_path.join("unrelated.txt");
    fs::write(&unrelated_path, "unrelated dirty content").unwrap();

    // Safe checkout to branch-b should succeed with dirty file preserved
    checkout_branch(repo_path, "branch-b").expect("safe checkout without conflict should succeed");
    assert_eq!(
        fs::read_to_string(&unrelated_path).unwrap(),
        "unrelated dirty content"
    );

    // 3. Make a commit modifying file1.txt on branch-b
    let file1_path = repo_path.join("file1.txt");
    fs::write(&file1_path, "modified file1 on branch-b\n").unwrap();
    visual_git_lib::write::staging::stage_all(repo_path).unwrap();
    visual_git_lib::write::commit::create_commit(
        repo_path,
        "Update file1 on branch-b",
        None,
        false,
    )
    .unwrap();

    // Switch back to master (file1.txt will be restored to initial on master)
    let initial_head_branch = "master";
    checkout_branch(repo_path, initial_head_branch)
        .expect("checkout back to master should succeed");

    // Now dirty file1.txt in working tree on master with conflicting changes
    fs::write(&file1_path, "conflicting local changes to file1\n").unwrap();

    // Now trying to checkout branch-b should fail with CHECKOUT_CONFLICT
    let err = checkout_branch(repo_path, "branch-b").unwrap_err();
    let err_str = err.to_string();
    assert!(
        err_str.contains("CHECKOUT_CONFLICT") || err_str.contains("conflict"),
        "Error should indicate conflict: {}",
        err_str
    );
}

#[test]
fn test_rename_branch() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    create_branch(repo_path, "feature/old-name", None, false).unwrap();
    visual_git_lib::write::branch::rename_branch(repo_path, "feature/old-name", "feature/new-name")
        .expect("rename should succeed");

    let repo = fixture.repo();
    assert!(repo
        .find_branch("feature/old-name", git2::BranchType::Local)
        .is_err());
    let new_branch = repo
        .find_branch("feature/new-name", git2::BranchType::Local)
        .expect("new branch exists");
    assert_eq!(new_branch.name().unwrap().unwrap(), "feature/new-name");
}

#[test]
fn test_delete_head_branch_forbidden() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    let head_branch = fixture
        .repo()
        .head()
        .unwrap()
        .shorthand()
        .unwrap()
        .to_string();
    let err =
        visual_git_lib::write::branch::delete_branch(repo_path, &head_branch, false).unwrap_err();
    assert!(err
        .to_string()
        .contains("Không thể xoá nhánh đang được chọn (HEAD)"));
}

#[test]
fn test_delete_merged_branch() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    create_branch(repo_path, "feature/merged-branch", None, false).unwrap();
    let backup_ref =
        visual_git_lib::write::branch::delete_branch(repo_path, "feature/merged-branch", false)
            .expect("delete merged branch should succeed");

    assert!(backup_ref.starts_with("refs/gitui-backup/delete-branch-"));
    let repo = fixture.repo();
    assert!(repo
        .find_branch("feature/merged-branch", git2::BranchType::Local)
        .is_err());
    assert!(
        repo.find_reference(&backup_ref).is_ok(),
        "backup ref must exist"
    );
}

#[test]
fn test_delete_unmerged_branch_requires_force() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();

    create_branch(repo_path, "feature/unmerged", None, true).unwrap();
    let file2_path = repo_path.join("file2.txt");
    fs::write(&file2_path, "content on unmerged branch\n").unwrap();
    visual_git_lib::write::staging::stage_all(repo_path).unwrap();
    visual_git_lib::write::commit::create_commit(repo_path, "Unmerged commit", None, false)
        .unwrap();

    // Switch back to master
    checkout_branch(repo_path, "master").unwrap();

    // Attempt delete without force
    let err = visual_git_lib::write::branch::delete_branch(repo_path, "feature/unmerged", false)
        .unwrap_err();
    assert!(err.to_string().contains("UNMERGED_BRANCH"));

    // Attempt delete with force = true
    let backup_ref =
        visual_git_lib::write::branch::delete_branch(repo_path, "feature/unmerged", true)
            .expect("force delete unmerged branch should succeed");

    assert!(backup_ref.starts_with("refs/gitui-backup/delete-branch-"));
    let repo = fixture.repo();
    assert!(repo
        .find_branch("feature/unmerged", git2::BranchType::Local)
        .is_err());
    assert!(
        repo.find_reference(&backup_ref).is_ok(),
        "backup ref must exist"
    );
}

#[test]
fn deleting_two_branches_in_one_second_backs_up_both() {
    let dir = tempfile::tempdir().unwrap();
    let repo = git2::Repository::init(dir.path()).unwrap();
    let sig = git2::Signature::now("T", "t@t.com").unwrap();
    let tree = {
        let mut index = repo.index().unwrap();
        let oid = index.write_tree().unwrap();
        repo.find_tree(oid).unwrap()
    };
    let base = repo
        .commit(Some("HEAD"), &sig, &sig, "init", &tree, &[])
        .unwrap();
    let head = repo.find_commit(base).unwrap();
    let extra = repo
        .commit(None, &sig, &sig, "extra", &tree, &[&head])
        .unwrap();
    repo.branch("alpha", &head, false).unwrap();
    repo.branch("beta", &repo.find_commit(extra).unwrap(), false)
        .unwrap();

    let path = dir.path();
    let a = visual_git_lib::write::branch::delete_branch(path, "alpha", true).unwrap();
    let b = visual_git_lib::write::branch::delete_branch(path, "beta", true).unwrap();

    let a_receipt = repo.find_reference(&a).unwrap().peel_to_commit().unwrap();
    let b_receipt = repo.find_reference(&b).unwrap().peel_to_commit().unwrap();
    assert_eq!(a_receipt.parent_id(0).unwrap(), base);
    assert_eq!(b_receipt.parent_id(0).unwrap(), extra);
}

#[test]
fn delete_branch_does_not_create_a_receipt_when_the_branch_is_locked() {
    let fixture = TestRepoFixture::new();
    let repo_path = fixture.path();
    create_branch(repo_path, "feature/locked", None, false).unwrap();
    let repo = fixture.repo();
    let before = repo
        .references_glob("refs/gitui-backup/*")
        .unwrap()
        .flatten()
        .count();
    let mut blocker = repo.transaction().unwrap();
    blocker.lock_ref("refs/heads/feature/locked").unwrap();

    assert!(visual_git_lib::write::branch::delete_branch(
        repo_path,
        "feature/locked",
        false
    )
    .is_err());
    assert!(repo
        .find_branch("feature/locked", git2::BranchType::Local)
        .is_ok());
    let after = repo
        .references_glob("refs/gitui-backup/*")
        .unwrap()
        .flatten()
        .count();
    assert_eq!(after, before);
}
