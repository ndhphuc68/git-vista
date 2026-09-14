use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct MergeResult {
    pub success: bool,
    pub status: String,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RebaseResult {
    pub success: bool,
    pub status: String,
    pub output: String,
}

pub fn git_merge<P: AsRef<Path>>(
    repo_path: P,
    target_branch: &str,
    no_ff: bool,
) -> Result<MergeResult, AppError> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref()).arg("merge");

    if no_ff {
        cmd.arg("--no-ff");
    }
    cmd.arg(target_branch);

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr);

    if output.status.success() {
        let status = if combined.contains("Already up to date") {
            "AlreadyUpToDate".to_string()
        } else if combined.contains("Fast-forward") {
            "FastForward".to_string()
        } else {
            "Merged".to_string()
        };
        Ok(MergeResult {
            success: true,
            status,
            output: combined.trim().to_string(),
        })
    } else {
        let status = if combined.contains("CONFLICT") || combined.contains("Automatic merge failed") {
            "Conflict".to_string()
        } else {
            "Error".to_string()
        };
        Ok(MergeResult {
            success: false,
            status,
            output: combined.trim().to_string(),
        })
    }
}

pub fn git_rebase<P: AsRef<Path>>(
    repo_path: P,
    upstream_branch: &str,
) -> Result<RebaseResult, AppError> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref())
        .args(["rebase", upstream_branch]);

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr);

    if output.status.success() {
        let status = if combined.contains("Current branch is up to date") || combined.contains("is up to date") {
            "AlreadyUpToDate".to_string()
        } else {
            "Success".to_string()
        };
        Ok(RebaseResult {
            success: true,
            status,
            output: combined.trim().to_string(),
        })
    } else {
        let status = if combined.contains("CONFLICT") || combined.contains("could not apply") {
            "Conflict".to_string()
        } else {
            "Error".to_string()
        };
        Ok(RebaseResult {
            success: false,
            status,
            output: combined.trim().to_string(),
        })
    }
}

pub fn git_abort_operation<P: AsRef<Path>>(repo_path: P, operation: &str) -> Result<(), AppError> {
    let op = if operation.to_lowercase().contains("rebase") {
        "rebase"
    } else {
        "merge"
    };

    let output = Command::new("git")
        .current_dir(repo_path.as_ref())
        .args([op, "--abort"])
        .output()
        .map_err(|e| AppError::Io(e.to_string()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InvalidOperation(format!("Không thể huỷ bỏ {}: {}", op, stderr)));
    }
    Ok(())
}

pub fn git_continue_operation<P: AsRef<Path>>(repo_path: P, operation: &str) -> Result<(), AppError> {
    let op = if operation.to_lowercase().contains("rebase") {
        "rebase"
    } else {
        "merge"
    };

    let output = Command::new("git")
        .current_dir(repo_path.as_ref())
        .args([op, "--continue"])
        .output()
        .map_err(|e| AppError::Io(e.to_string()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InvalidOperation(format!("Không thể tiếp tục {}: {}", op, stderr)));
    }
    Ok(())
}
