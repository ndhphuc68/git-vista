use crate::error::AppError;
use crate::exec::run_git_command;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct CheckoutPrResult {
    pub branch_name: String,
    pub message: String,
}

/// Kéo nhánh PR từ remote origin về và checkout sang nhánh đó
pub fn checkout_pull_request<P: AsRef<Path>>(
    repo_path: P,
    pr_number: u64,
) -> Result<CheckoutPrResult, AppError> {
    let repo_ref = repo_path.as_ref();
    let repo = git2::Repository::open(repo_ref)?;

    // 1. Kiểm tra an toàn: working tree phải sạch (không có uncommitted/unstaged changes)
    let statuses = repo.statuses(None)?;
    let is_dirty = statuses.iter().any(|s| {
        let status = s.status();
        !status.is_ignored()
    });

    if is_dirty {
        return Err(AppError::InvalidOperation(
            "Không thể checkout nhánh PR khi có thay đổi chưa commit. Vui lòng commit hoặc stash trước.".to_string(),
        ));
    }

    let branch_name = format!("pr/{}", pr_number);
    let refspec = format!("pull/{}/head:{}", pr_number, branch_name);

    // 2. Thực thi: git fetch origin pull/<number>/head:pr/<number> --force
    let fetch_res = run_git_command(
        repo_ref,
        &["fetch", "origin", &refspec, "--force"],
    );

    if let Err(e) = fetch_res {
        return Err(AppError::Git(format!(
            "Không thể fetch nhánh PR #{} từ remote: {}",
            pr_number, e
        )));
    }

    // 3. Thực thi: git checkout pr/<number>
    let checkout_res = run_git_command(
        repo_ref,
        &["checkout", &branch_name],
    );

    if let Err(e) = checkout_res {
        return Err(AppError::Git(format!(
            "Không thể checkout nhánh {}: {}",
            branch_name, e
        )));
    }

    Ok(CheckoutPrResult {
        branch_name: branch_name.clone(),
        message: format!("Đã chuyển sang nhánh {} thành công.", branch_name),
    })
}
