use crate::error::AppError;
use git2::{Oid, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BlameLine {
    pub line_no: u32,
    pub content: String,
    pub commit_id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp_sec: f64,
    pub is_hunk_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileBlameResult {
    pub file_path: String,
    pub commit_id: Option<String>,
    pub lines: Vec<BlameLine>,
    pub total_lines: u32,
}

/// Lấy thông tin Git Blame từng dòng của tệp tin.
/// Nếu `commit_id` có giá trị, blame tại commit đó; nếu None, blame tại HEAD / working copy.
pub fn get_file_blame<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    commit_id: Option<&str>,
) -> Result<FileBlameResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(FileBlameResult {
            file_path: file_path.to_string(),
            commit_id: commit_id.map(|s| s.to_string()),
            lines: Vec::new(),
            total_lines: 0,
        });
    }

    let mut opts = git2::BlameOptions::new();
    let target_oid = if let Some(cid) = commit_id {
        let trimmed = cid.trim();
        if !trimmed.is_empty() {
            let oid = Oid::from_str(trimmed)?;
            opts.newest_commit(oid);
            Some(oid)
        } else {
            None
        }
    } else {
        None
    };

    let blame = repo.blame_file(Path::new(file_path), Some(&mut opts))?;

    // Đọc nội dung tệp tin tại commit mục tiêu hoặc từ working directory / index
    let content_str: String = if let Some(oid) = target_oid {
        let commit = repo.find_commit(oid)?;
        let tree = commit.tree()?;
        let entry = tree
            .get_path(Path::new(file_path))
            .map_err(|_| AppError::NotFound(format!("Path '{}' not found at commit {}", file_path, oid)))?;
        let blob = repo.find_blob(entry.id())?;
        if blob.is_binary() {
            return Err(AppError::InvalidOperation("Binary file is not supported for blame".to_string()));
        }
        std::str::from_utf8(blob.content())
            .map_err(|e| AppError::InvalidOperation(format!("UTF-8 decode error: {}", e)))?
            .to_string()
    } else {
        let workdir = repo.workdir().unwrap_or_else(|| repo_path.as_ref());
        let disk_path = workdir.join(file_path);
        if disk_path.exists() {
            let bytes = std::fs::read(&disk_path)?;
            if bytes.contains(&0) {
                return Err(AppError::InvalidOperation("Binary file is not supported for blame".to_string()));
            }
            String::from_utf8_lossy(&bytes).to_string()
        } else if let Ok(head) = repo.head() {
            let commit = head.peel_to_commit()?;
            let tree = commit.tree()?;
            let entry = tree
                .get_path(Path::new(file_path))
                .map_err(|_| AppError::NotFound(format!("Path '{}' not found in HEAD", file_path)))?;
            let blob = repo.find_blob(entry.id())?;
            if blob.is_binary() {
                return Err(AppError::InvalidOperation("Binary file is not supported for blame".to_string()));
            }
            std::str::from_utf8(blob.content())
                .map_err(|e| AppError::InvalidOperation(format!("UTF-8 decode error: {}", e)))?
                .to_string()
        } else {
            return Err(AppError::NotFound(format!("File '{}' not found", file_path)));
        }
    };

    let raw_lines: Vec<&str> = content_str.lines().collect();
    let total_lines = raw_lines.len() as u32;

    if total_lines == 0 {
        return Ok(FileBlameResult {
            file_path: file_path.to_string(),
            commit_id: commit_id.map(|s| s.to_string()),
            lines: Vec::new(),
            total_lines: 0,
        });
    }

    let mut commit_cache: HashMap<Oid, (String, String, String, f64)> = HashMap::new();
    let mut blame_lines: Vec<BlameLine> = Vec::with_capacity(raw_lines.len());
    let mut prev_commit_id: Option<String> = None;

    for (idx, line_text) in raw_lines.iter().enumerate() {
        let line_no = (idx + 1) as u32;

        if let Some(hunk) = blame.get_line(line_no as usize) {
            let commit_oid = hunk.final_commit_id();
            let commit_id_str = commit_oid.to_string();
            let short_id = if commit_id_str.len() >= 7 {
                commit_id_str[..7].to_string()
            } else {
                commit_id_str.clone()
            };

            let (summary, author_name, author_email, timestamp_sec) =
                if let Some(cached) = commit_cache.get(&commit_oid) {
                    cached.clone()
                } else {
                    let data = match repo.find_commit(commit_oid) {
                        Ok(c) => {
                            let s = c.summary().ok().flatten().unwrap_or("").to_string();
                            let sig = c.author();
                            let name = sig.name().unwrap_or("").to_string();
                            let email = sig.email().unwrap_or("").to_string();
                            let time = sig.when().seconds() as f64;
                            (s, name, email, time)
                        }
                        Err(_) => {
                            if let Some(sig) = hunk.final_signature() {
                                let name = sig.name().unwrap_or("").to_string();
                                let email = sig.email().unwrap_or("").to_string();
                                let time = sig.when().seconds() as f64;
                                ("".to_string(), name, email, time)
                            } else {
                                ("".to_string(), "".to_string(), "".to_string(), 0.0)
                            }
                        }
                    };
                    commit_cache.insert(commit_oid, data.clone());
                    data
                };

            let is_hunk_start = prev_commit_id.as_deref() != Some(&commit_id_str);
            prev_commit_id = Some(commit_id_str.clone());

            blame_lines.push(BlameLine {
                line_no,
                content: line_text.to_string(),
                commit_id: commit_id_str,
                short_id,
                summary,
                author_name,
                author_email,
                timestamp_sec,
                is_hunk_start,
            });
        } else {
            blame_lines.push(BlameLine {
                line_no,
                content: line_text.to_string(),
                commit_id: "".to_string(),
                short_id: "".to_string(),
                summary: "".to_string(),
                author_name: "".to_string(),
                author_email: "".to_string(),
                timestamp_sec: 0.0,
                is_hunk_start: false,
            });
        }
    }

    Ok(FileBlameResult {
        file_path: file_path.to_string(),
        commit_id: commit_id.map(|s| s.to_string()),
        lines: blame_lines,
        total_lines,
    })
}
