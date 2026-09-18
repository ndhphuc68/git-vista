use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct GitHubRepoInfo {
    pub is_github: bool,
    pub owner: Option<String>,
    pub repo: Option<String>,
    pub default_branch: Option<String>,
}

/// Trích xuất (owner, repo) từ một Git remote URL bất kỳ
/// Hỗ trợ:
/// - https://github.com/owner/repo.git
/// - https://github.com/owner/repo
/// - git@github.com:owner/repo.git
/// - git@github.com:owner/repo
pub fn parse_github_remote_url(url: &str) -> Option<(String, String)> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Check SSH: git@github.com:owner/repo(.git)
    if let Some(rest) = trimmed.strip_prefix("git@github.com:") {
        let path = rest.strip_suffix(".git").unwrap_or(rest);
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() == 2 && !parts[0].is_empty() && !parts[1].is_empty() {
            return Some((parts[0].to_string(), parts[1].to_string()));
        }
    }

    // Check HTTPS: https://github.com/owner/repo(.git) or http:// or ssh://git@github.com/
    if let Some(rest) = trimmed.strip_prefix("https://github.com/")
        .or_else(|| trimmed.strip_prefix("http://github.com/"))
        .or_else(|| trimmed.strip_prefix("ssh://git@github.com/"))
    {
        let path = rest.strip_suffix(".git").unwrap_or(rest);
        let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        if parts.len() == 2 && !parts[0].is_empty() && !parts[1].is_empty() {
            return Some((parts[0].to_string(), parts[1].to_string()));
        }
    }

    None
}

/// Đọc thông tin GitHub của repo hiện tại từ remote `origin` (hoặc remote đầu tiên)
pub fn get_github_repo_info<P: AsRef<Path>>(repo_path: P) -> Result<GitHubRepoInfo, AppError> {
    let repo = git2::Repository::open(repo_path.as_ref())?;

    let remotes = repo.remotes()?;
    let mut target_remote_name: Option<String> = None;

    // Ưu tiên "origin", nếu không có thì lấy remote đầu tiên
    for name_opt in remotes.iter() {
        if let Ok(Some(name)) = name_opt {
            if name == "origin" {
                target_remote_name = Some(name.to_string());
                break;
            } else if target_remote_name.is_none() {
                target_remote_name = Some(name.to_string());
            }
        }
    }

    let mut is_github = false;
    let mut owner = None;
    let mut repo_name = None;

    if let Some(name) = target_remote_name {
        if let Ok(remote) = repo.find_remote(&name) {
            if let Ok(url) = remote.url() {
                if let Some((o, r)) = parse_github_remote_url(url) {
                    is_github = true;
                    owner = Some(o);
                    repo_name = Some(r);
                }
            }
        }
    }

    // Tìm default branch (HEAD shorthand)
    let default_branch = repo.head().ok().and_then(|h| {
        h.shorthand().ok().map(|s| s.to_string())
    });

    Ok(GitHubRepoInfo {
        is_github,
        owner,
        repo: repo_name,
        default_branch,
    })
}
