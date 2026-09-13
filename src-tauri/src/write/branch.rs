use crate::error::AppError;
use git2::{build::CheckoutBuilder, BranchType, Oid, Reference, Repository};
use std::path::Path;

/// Kiểm tra tính hợp lệ của tên nhánh Git
pub fn validate_branch_name(name: &str) -> Result<(), AppError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidOperation(
            "Tên nhánh không được để trống".into(),
        ));
    }
    let ref_name = format!("refs/heads/{}", trimmed);
    if !Reference::is_valid_name(&ref_name) {
        return Err(AppError::InvalidOperation(format!(
            "Tên nhánh '{}' không hợp lệ theo quy chuẩn Git",
            trimmed
        )));
    }
    Ok(())
}

/// Tạo nhánh mới từ HEAD hoặc commit chỉ định; tuỳ chọn checkout ngay
pub fn create_branch<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    target_commit_id: Option<&str>,
    checkout: bool,
) -> Result<(), AppError> {
    let trimmed = name.trim();
    validate_branch_name(trimmed)?;
    let repo = Repository::open(repo_path.as_ref())?;

    let target_commit = if let Some(oid_str) = target_commit_id {
        let oid = Oid::from_str(oid_str.trim())
            .map_err(|e| AppError::InvalidOperation(format!("Commit OID không hợp lệ: {}", e)))?;
        repo.find_commit(oid)?
    } else {
        let head = repo.head()?;
        head.peel_to_commit()?
    };

    repo.branch(trimmed, &target_commit, false)?;

    if checkout {
        checkout_branch(repo_path, trimmed)?;
    }

    Ok(())
}

/// Chuyển sang nhánh chỉ định bằng cơ chế Safe Checkout của Git
pub fn checkout_branch<P: AsRef<Path>>(repo_path: P, branch_name: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let branch = repo.find_branch(branch_name, BranchType::Local)?;

    let commit = branch.get().peel_to_commit()?;
    let tree = commit.tree()?;

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.safe();

    if let Err(e) = repo.checkout_tree(tree.as_object(), Some(&mut checkout_opts)) {
        if e.code() == git2::ErrorCode::Conflict {
            return Err(AppError::InvalidOperation(format!(
                "CHECKOUT_CONFLICT: Không thể chuyển sang nhánh '{}' vì có các thay đổi chưa commit bị xung đột với nhánh đích.",
                branch_name
            )));
        }
        return Err(AppError::Git(e.message().to_string()));
    }

    let ref_name = format!("refs/heads/{}", branch_name);
    repo.set_head(&ref_name)?;

    Ok(())
}

/// Đổi tên nhánh local
pub fn rename_branch<P: AsRef<Path>>(
    repo_path: P,
    old_name: &str,
    new_name: &str,
) -> Result<(), AppError> {
    let trimmed_new = new_name.trim();
    validate_branch_name(trimmed_new)?;

    let repo = Repository::open(repo_path.as_ref())?;
    let mut branch = repo.find_branch(old_name.trim(), BranchType::Local)?;
    branch.rename(trimmed_new, false)?;

    Ok(())
}

/// Xoá nhánh an toàn: kiểm tra HEAD, kiểm tra merged, tạo backup ref
pub fn delete_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
    force: bool,
) -> Result<String, AppError> {
    let trimmed = branch_name.trim();
    let repo = Repository::open(repo_path.as_ref())?;

    // 1. Kiểm tra HEAD
    if let Ok(head) = repo.head() {
        if head.shorthand() == Some(trimmed) {
            return Err(AppError::InvalidOperation(
                "Không thể xoá nhánh đang được chọn (HEAD)".into(),
            ));
        }
    }

    let mut branch = repo.find_branch(trimmed, BranchType::Local)?;
    let branch_commit = branch.get().peel_to_commit()?;

    // 2. Kiểm tra merged
    if !force {
        if let Ok(head) = repo.head() {
            if let Ok(head_commit) = head.peel_to_commit() {
                let is_merged = head_commit.id() == branch_commit.id()
                    || repo
                        .graph_descendant_of(head_commit.id(), branch_commit.id())
                        .unwrap_or(false);
                if !is_merged {
                    return Err(AppError::InvalidOperation(
                        "UNMERGED_BRANCH: Nhánh này chứa các commit chưa được gộp vào HEAD.".into(),
                    ));
                }
            }
        }
    }

    // 3. Tạo backup ref trước khi xoá (mục 6.4)
    let sanitized_name = trimmed.replace('/', "-");
    let backup_action = format!("delete-branch-{}", sanitized_name);
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| AppError::InvalidOperation(e.to_string()))?
        .as_secs();
    let backup_ref_name = format!("refs/gitui-backup/{}-{}", backup_action, timestamp);
    repo.reference(
        &backup_ref_name,
        branch_commit.id(),
        false,
        "Backup before branch deletion",
    )?;

    // 4. Xoá nhánh
    branch.delete()?;

    Ok(backup_ref_name)
}

