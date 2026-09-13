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
