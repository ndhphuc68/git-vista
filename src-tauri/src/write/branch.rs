use crate::error::AppError;
use git2::{build::CheckoutBuilder, BranchType, Oid, Reference, Repository};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct BranchDeletionRecovery {
    pub version: u8,
    pub branch_name: String,
    pub target: String,
    pub nonce: String,
}

fn recovery_signature(repo: &Repository) -> Result<git2::Signature<'static>, AppError> {
    repo.signature().map(|sig| sig.to_owned()).or_else(|_| {
        git2::Signature::now("Visual Git Client", "app@visualgit.local").map_err(AppError::from)
    })
}

/// Kiểm tra tính hợp lệ của tên nhánh Git
pub fn validate_branch_name(name: &str) -> Result<(), AppError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidOperation(
            "Tên nhánh không được để trống".into(),
        ));
    }
    if trimmed.starts_with('-') {
        return Err(AppError::InvalidOperation(
            "Branch name cannot start with '-' because Git CLI would parse it as an option".into(),
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
    validate_branch_name(trimmed)?;
    let repo = Repository::open(repo_path.as_ref())?;
    let branch_ref = format!("refs/heads/{trimmed}");
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("HEAD")?;
    transaction.lock_ref(&branch_ref)?;

    // 1. Kiểm tra HEAD
    if let Ok(head) = repo.head() {
        if head.shorthand().ok() == Some(trimmed) {
            return Err(AppError::InvalidOperation(
                "Không thể xoá nhánh đang được chọn (HEAD)".into(),
            ));
        }
    }

    let branch = repo.find_branch(trimmed, BranchType::Local)?;
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

    // 3. Create a typed receipt whose payload binds this exact branch to its
    // target. The parent keeps the deleted commit reachable for recovery.
    static NEXT_RECEIPT: AtomicU64 = AtomicU64::new(0);
    let nonce = format!(
        "{}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos(),
        NEXT_RECEIPT.fetch_add(1, Ordering::Relaxed)
    );
    let recovery = BranchDeletionRecovery {
        version: 1,
        branch_name: trimmed.to_string(),
        target: branch_commit.id().to_string(),
        nonce,
    };
    let message =
        serde_json::to_string(&recovery).map_err(|error| AppError::Io(error.to_string()))?;
    let tree = branch_commit.tree()?;
    let signature = recovery_signature(&repo)?;
    let receipt_commit = repo.commit(
        None,
        &signature,
        &signature,
        &message,
        &tree,
        &[&branch_commit],
    )?;
    let backup_ref_name = crate::write::create_backup_ref(&repo, "delete-branch", receipt_commit)?;

    // 4. Remove exactly the ref whose target was captured while the lock was
    // held. A concurrent checkout/retarget cannot slip between receipt and delete.
    drop(branch);
    transaction.remove(&branch_ref)?;
    transaction.commit()?;

    Ok(backup_ref_name)
}
