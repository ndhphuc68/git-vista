use crate::error::AppError;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn get_token_file_path() -> Result<PathBuf, AppError> {
    if let Ok(p) = std::env::var("GITVISTA_TOKEN_PATH") {
        return Ok(PathBuf::from(p));
    }
    let base_dir = std::env::var("APPDATA")
        .map(PathBuf::from)
        .or_else(|_| std::env::var("HOME").map(|h| PathBuf::from(h).join(".config")))
        .or_else(|_| std::env::var("USERPROFILE").map(|u| PathBuf::from(u).join(".config")))
        .map_err(|_| AppError::InvalidOperation("Không thể xác định thư mục cấu hình người dùng".into()))?;

    let dir = base_dir.join("gitvista");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    Ok(dir.join("github_token"))
}

pub fn save_github_token(token: &str) -> Result<(), AppError> {
    let path = get_token_file_path()?;
    fs::write(path, token.trim())
        .map_err(|e| AppError::Io(format!("Lỗi khi lưu GitHub token: {}", e)))?;
    Ok(())
}

pub fn remove_github_token() -> Result<(), AppError> {
    let path = get_token_file_path()?;
    if path.exists() {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

pub fn get_github_token() -> Result<Option<String>, AppError> {
    // 1. Kiểm tra token đã lưu trong file
    if let Ok(path) = get_token_file_path() {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                let trimmed = content.trim();
                if !trimmed.is_empty() {
                    return Ok(Some(trimmed.to_string()));
                }
            }
        }
    }

    // 2. Fallback: Kiểm tra xem gh CLI có sẵn không
    if let Ok(output) = Command::new("gh").args(["auth", "token"]).output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let trimmed = stdout.trim();
            if !trimmed.is_empty() {
                return Ok(Some(trimmed.to_string()));
            }
        }
    }

    Ok(None)
}
