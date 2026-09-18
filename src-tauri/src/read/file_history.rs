use crate::error::AppError;
use git2::{Oid, Repository, Sort};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileHistoryItem {
    pub commit_id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp_sec: f64,
    pub change_type: String, // "added" | "modified" | "deleted"
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileHistoryResult {
    pub file_path: String,
    pub commits: Vec<FileHistoryItem>,
    pub has_more: bool,
    pub total_count: u32,
}

/// Lấy danh sách lịch sử commit tác động đến một file cụ thể (ngược dòng thời gian).
pub fn get_file_history<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    offset: Option<u32>,
    limit: Option<u32>,
) -> Result<FileHistoryResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(FileHistoryResult {
            file_path: file_path.to_string(),
            commits: Vec::new(),
            has_more: false,
            total_count: 0,
        });
    }

    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)?;
    let _ = revwalk.push_head();
    let _ = revwalk.push_glob("refs/heads/*");

    let mut seen: HashSet<Oid> = HashSet::new();
    let mut matching_commits: Vec<FileHistoryItem> = Vec::new();
    let target_path = Path::new(file_path);

    for oid_res in revwalk {
        let oid = match oid_res {
            Ok(o) => o,
            Err(_) => continue,
        };

        if !seen.insert(oid) {
            continue;
        }

        let commit = match repo.find_commit(oid) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let commit_tree = match commit.tree() {
            Ok(t) => t,
            Err(_) => continue,
        };

        let child_entry = commit_tree.get_path(target_path).ok();
        let parent_count = commit.parent_count();

        let change_type: Option<String> = if parent_count == 0 {
            if child_entry.is_some() {
                Some("added".to_string())
            } else {
                None
            }
        } else {
            let mut modified = false;
            let mut added = false;
            let mut deleted = false;
            let mut all_parents_same = true;

            for parent in commit.parents() {
                let parent_tree = match parent.tree() {
                    Ok(t) => t,
                    Err(_) => continue,
                };
                let parent_entry = parent_tree.get_path(target_path).ok();

                match (&parent_entry, &child_entry) {
                    (None, None) => {
                        // File không tồn tại ở cả 2 commit
                    }
                    (None, Some(_)) => {
                        all_parents_same = false;
                        added = true;
                    }
                    (Some(_), None) => {
                        all_parents_same = false;
                        deleted = true;
                    }
                    (Some(p), Some(c)) => {
                        if p.id() != c.id() {
                            all_parents_same = false;
                            modified = true;
                        }
                    }
                }
            }

            if all_parents_same {
                None
            } else if modified {
                Some("modified".to_string())
            } else if added {
                Some("added".to_string())
            } else if deleted {
                Some("deleted".to_string())
            } else {
                Some("modified".to_string())
            }
        };

        if let Some(ct) = change_type {
            let id_str = oid.to_string();
            let short_id = if id_str.len() >= 7 {
                id_str[..7].to_string()
            } else {
                id_str.clone()
            };
            let summary = commit.summary().ok().flatten().unwrap_or("").to_string();
            let sig = commit.author();
            let author_name = sig.name().unwrap_or("").to_string();
            let author_email = sig.email().unwrap_or("").to_string();
            let timestamp_sec = sig.when().seconds() as f64;

            matching_commits.push(FileHistoryItem {
                commit_id: id_str,
                short_id,
                summary,
                author_name,
                author_email,
                timestamp_sec,
                change_type: ct,
            });
        }
    }

    let offset = offset.unwrap_or(0) as usize;
    let limit = limit.unwrap_or(50) as usize;
    let total_count = matching_commits.len() as u32;

    let end = (offset + limit).min(matching_commits.len());
    let paginated = if offset < matching_commits.len() {
        matching_commits[offset..end].to_vec()
    } else {
        Vec::new()
    };
    let has_more = end < matching_commits.len();

    Ok(FileHistoryResult {
        file_path: file_path.to_string(),
        commits: paginated,
        has_more,
        total_count,
    })
}
