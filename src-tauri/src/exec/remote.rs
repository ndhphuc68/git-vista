use crate::error::AppError;
use crate::exec::run_git_streaming_command;
use std::path::Path;

/// Chuyển đổi thông báo lỗi từ stderr của git CLI thành thông điệp thân thiện với người dùng tiếng Việt
pub fn map_git_remote_error(stderr: &str) -> AppError {
    let lower = stderr.to_lowercase();
    if lower.contains("authentication failed")
        || lower.contains("permission denied (publickey)")
        || lower.contains("could not read username")
    {
        AppError::Git(
            "Xác thực thất bại. Vui lòng kiểm tra SSH key hoặc token xác thực cá nhân.".into(),
        )
    } else if lower.contains("[rejected]")
        || lower.contains("fetch first")
        || lower.contains("non-fast-forward")
    {
        AppError::Git(
            "Nhánh từ xa có commit mới hơn. Vui lòng thực hiện Pull trước khi Push.".into(),
        )
    } else if lower.contains("could not resolve host")
        || lower.contains("unable to access")
        || lower.contains("connection timed out")
        || lower.contains("failed to connect")
    {
        AppError::Git(
            "Không thể kết nối đến máy chủ Git từ xa. Vui lòng kiểm tra kết nối mạng.".into(),
        )
    } else if lower.contains("repository not found") {
        AppError::Git("Không tìm thấy kho lưu trữ từ xa (Repository not found).".into())
    } else if lower.contains("already exists and is not an empty directory") {
        AppError::Git("Thư mục đích đã tồn tại và không trống.".into())
    } else if lower.contains("cancelled")
        || lower.contains("canceled")
        || lower.contains("terminated")
    {
        AppError::Git("Thao tác đã bị huỷ bởi người dùng.".into())
    } else {
        AppError::Git(if stderr.trim().is_empty() {
            "Thao tác Git từ xa thất bại.".to_string()
        } else {
            stderr.trim().to_string()
        })
    }
}

/// Thực thi `git fetch` với streaming tiến độ
pub fn git_fetch<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
    repo_path: P,
    remote: Option<&str>,
    prune: bool,
    task_id: &str,
    on_progress: F,
) -> Result<String, AppError> {
    if let Some(remote) = remote {
        crate::exec::validate_git_operand(remote, "remote")?;
    }
    let mut args = vec!["fetch", "--progress"];
    if prune {
        args.push("--prune");
    }
    if let Some(r) = remote {
        args.push(r);
    }

    let output =
        run_git_streaming_command(repo_path, &args, task_id, on_progress).map_err(|e| match e {
            AppError::CommandFailed { stderr, .. } => map_git_remote_error(&stderr),
            other => other,
        })?;

    Ok(if output.stdout.trim().is_empty() {
        if output.stderr.trim().is_empty() {
            "Fetch hoàn tất.".to_string()
        } else {
            output.stderr.trim().to_string()
        }
    } else {
        output.stdout.trim().to_string()
    })
}

/// Thực thi `git pull` với streaming tiến độ
pub fn git_pull<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
    repo_path: P,
    remote: Option<&str>,
    branch: Option<&str>,
    rebase: Option<bool>,
    task_id: &str,
    on_progress: F,
) -> Result<String, AppError> {
    if let Some(remote) = remote {
        crate::exec::validate_git_operand(remote, "remote")?;
    }
    if let Some(branch) = branch {
        crate::exec::validate_git_operand(branch, "branch")?;
    }
    let mut args = vec!["pull", "--progress"];
    if let Some(r) = rebase {
        if r {
            args.push("--rebase");
        } else {
            args.push("--no-rebase");
        }
    }
    if let Some(r) = remote {
        args.push(r);
    }
    if let Some(b) = branch {
        args.push(b);
    }

    let output =
        run_git_streaming_command(repo_path, &args, task_id, on_progress).map_err(|e| match e {
            AppError::CommandFailed { stderr, .. } => map_git_remote_error(&stderr),
            other => other,
        })?;

    Ok(if output.stdout.trim().is_empty() {
        if output.stderr.trim().is_empty() {
            "Pull hoàn tất.".to_string()
        } else {
            output.stderr.trim().to_string()
        }
    } else {
        output.stdout.trim().to_string()
    })
}

/// Thực thi `git push` với streaming tiến độ
pub fn git_push<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
    repo_path: P,
    remote: Option<&str>,
    branch: Option<&str>,
    set_upstream: bool,
    force: bool,
    task_id: &str,
    on_progress: F,
) -> Result<String, AppError> {
    if let Some(remote) = remote {
        crate::exec::validate_git_operand(remote, "remote")?;
    }
    if let Some(branch) = branch {
        crate::exec::validate_git_operand(branch, "branch")?;
    }
    let mut args = vec!["push", "--progress"];
    if set_upstream {
        args.push("-u");
    }
    if force {
        args.push("--force-with-lease");
    }
    if let Some(r) = remote {
        args.push(r);
    }
    if let Some(b) = branch {
        args.push(b);
    }

    let output =
        run_git_streaming_command(repo_path, &args, task_id, on_progress).map_err(|e| match e {
            AppError::CommandFailed { stderr, .. } => map_git_remote_error(&stderr),
            other => other,
        })?;

    Ok(if output.stdout.trim().is_empty() {
        if output.stderr.trim().is_empty() {
            "Push hoàn tất.".to_string()
        } else {
            output.stderr.trim().to_string()
        }
    } else {
        output.stdout.trim().to_string()
    })
}

/// Thực thi `git clone` với streaming tiến độ
pub fn git_clone<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
    url: &str,
    target_dir: P,
    task_id: &str,
    on_progress: F,
) -> Result<String, AppError> {
    crate::exec::validate_git_operand(url, "clone URL")?;
    let target_path = target_dir.as_ref();
    if let Some(parent) = target_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(AppError::from)?;
        }
    }
    let target_str = target_path
        .to_str()
        .ok_or_else(|| AppError::InvalidOperation("Đường dẫn thư mục không hợp lệ UTF-8".into()))?;

    let working_dir = target_path.parent().unwrap_or_else(|| Path::new("."));
    let args = vec!["clone", "--progress", url, target_str];

    let output = run_git_streaming_command(working_dir, &args, task_id, on_progress).map_err(
        |e| match e {
            AppError::CommandFailed { stderr, .. } => map_git_remote_error(&stderr),
            other => other,
        },
    )?;

    Ok(if output.stdout.trim().is_empty() {
        if output.stderr.trim().is_empty() {
            "Clone hoàn tất.".to_string()
        } else {
            output.stderr.trim().to_string()
        }
    } else {
        output.stdout.trim().to_string()
    })
}

/// Thiết lập cấu hình `pull.rebase` cho repo cụ thể
pub fn set_repo_pull_rebase<P: AsRef<Path>>(repo_path: P, rebase: bool) -> Result<(), AppError> {
    let repo = git2::Repository::open(repo_path.as_ref())?;
    let mut config = repo.config()?;
    config.set_bool("pull.rebase", rebase)?;
    Ok(())
}
