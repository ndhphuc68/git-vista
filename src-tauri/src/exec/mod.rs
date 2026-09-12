//! Module `exec`: Nơi duy nhất được phép spawn process thực thi `git` CLI (push, pull, fetch, rebase, merge).
//! Đảm bảo thừa hưởng credentials, SSH agent, hook, và xử lý timeout/cancel tập trung.

use crate::error::AppError;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone)]
pub struct GitCliOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

/// Chạy một lệnh git CLI trong repo_dir chỉ định
pub fn run_git_command<P: AsRef<Path>>(repo_dir: P, args: &[&str]) -> Result<GitCliOutput, AppError> {
    let output = Command::new("git")
        .current_dir(repo_dir.as_ref())
        .args(args)
        .output()
        .map_err(AppError::from)?;

    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(AppError::CommandFailed {
            code: exit_code,
            stderr,
        });
    }

    Ok(GitCliOutput {
        stdout,
        stderr,
        exit_code,
        success: true,
    })
}

/// Kiểm tra phiên bản Git CLI đang cài đặt trên máy người dùng
pub fn get_git_cli_version() -> Result<String, AppError> {
    let output = Command::new("git")
        .arg("--version")
        .output()
        .map_err(AppError::from)?;

    if !output.status.success() {
        return Err(AppError::CommandFailed {
            code: output.status.code().unwrap_or(-1),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

