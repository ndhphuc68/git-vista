use crate::error::AppError;
use git2::{Delta, DiffFormat, DiffOptions, Oid, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitChangedFile {
    pub path: String,
    pub status: String,
    pub additions: usize,
    pub deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitDetails {
    pub id: String,
    pub full_message: String,
    pub author_name: String,
    pub author_email: String,
    pub author_timestamp_sec: i64,
    pub parent_ids: Vec<String>,
    pub files: Vec<CommitChangedFile>,
    pub total_additions: usize,
    pub total_deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DiffLine {
    pub line_type: String,
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileDiffResult {
    pub file_path: String,
    pub status: String,
    pub hunks: Vec<DiffHunk>,
    pub additions: usize,
    pub deletions: usize,
}

static DIFF_CACHE: Mutex<Option<HashMap<(String, String), FileDiffResult>>> = Mutex::new(None);

fn get_cached_diff(key: &(String, String)) -> Option<FileDiffResult> {
    let lock = DIFF_CACHE.lock().unwrap();
    lock.as_ref().and_then(|map| map.get(key).cloned())
}

fn set_cached_diff(key: (String, String), result: FileDiffResult) {
    let mut lock = DIFF_CACHE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(HashMap::new());
    }
    lock.as_mut().unwrap().insert(key, result);
}

pub fn get_commit_info<P: AsRef<Path>>(
    repo_path: P,
    commit_id_str: &str,
) -> Result<CommitDetails, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(commit_id_str).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = repo.find_commit(oid)?;

    let commit_tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), None)?;
    let mut files = Vec::new();
    let mut total_additions = 0;
    let mut total_deletions = 0;

    let deltas: Vec<_> = diff.deltas().collect();
    for (idx, delta) in deltas.into_iter().enumerate() {
        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let status = match delta.status() {
            Delta::Added => "added",
            Delta::Deleted => "deleted",
            Delta::Renamed => "renamed",
            _ => "modified",
        };

        let mut patch = git2::Patch::from_diff(&diff, idx)?;
        let mut additions = 0;
        let mut deletions = 0;
        if let Some(ref mut p) = patch {
            let (_, adds, dels) = p.line_stats()?;
            additions = adds;
            deletions = dels;
        }

        total_additions += additions;
        total_deletions += deletions;

        files.push(CommitChangedFile {
            path,
            status: status.to_string(),
            additions,
            deletions,
        });
    }

    let parent_ids = commit.parents().map(|p| p.id().to_string()).collect();
    let author = commit.author();
    let author_name = author.name().unwrap_or("Unknown").to_string();
    let author_email = author.email().unwrap_or("").to_string();
    let full_message = commit.message().unwrap_or("").to_string();
    let author_timestamp_sec = commit.time().seconds();

    Ok(CommitDetails {
        id: commit_id_str.to_string(),
        full_message,
        author_name,
        author_email,
        author_timestamp_sec,
        parent_ids,
        files,
        total_additions,
        total_deletions,
    })
}

pub fn get_file_diff<P: AsRef<Path>>(
    repo_path: P,
    commit_id_str: &str,
    target_path: &str,
) -> Result<FileDiffResult, AppError> {
    let cache_key = (commit_id_str.to_string(), target_path.to_string());
    if let Some(cached) = get_cached_diff(&cache_key) {
        return Ok(cached);
    }

    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(commit_id_str).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = repo.find_commit(oid)?;

    let commit_tree = commit.tree()?;
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let mut opts = DiffOptions::new();
    opts.pathspec(target_path);

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), Some(&mut opts))?;

    let mut hunks: Vec<DiffHunk> = Vec::new();
    let mut additions = 0;
    let mut deletions = 0;
    let mut status = "modified".to_string();

    if let Some(delta) = diff.deltas().next() {
        status = match delta.status() {
            Delta::Added => "added",
            Delta::Deleted => "deleted",
            Delta::Renamed => "renamed",
            _ => "modified",
        }
        .to_string();
    }

    diff.print(DiffFormat::Patch, |_delta, hunk, line| {
        if let Some(h) = hunk {
            let header = String::from_utf8_lossy(h.header()).trim().to_string();
            let needs_new_hunk = match hunks.last() {
                Some(last) => last.header != header,
                None => true,
            };
            if needs_new_hunk {
                hunks.push(DiffHunk {
                    header,
                    old_start: h.old_start(),
                    old_lines: h.old_lines(),
                    new_start: h.new_start(),
                    new_lines: h.new_lines(),
                    lines: Vec::new(),
                });
            }
        }

        let origin = line.origin();
        let line_type = match origin {
            '+' => {
                additions += 1;
                "add"
            }
            '-' => {
                deletions += 1;
                "delete"
            }
            _ => "context",
        };

        let content = String::from_utf8_lossy(line.content()).to_string();
        if let Some(h) = hunks.last_mut() {
            h.lines.push(DiffLine {
                line_type: line_type.to_string(),
                content,
                old_lineno: line.old_lineno(),
                new_lineno: line.new_lineno(),
            });
        }
        true
    })?;

    let result = FileDiffResult {
        file_path: target_path.to_string(),
        status,
        hunks,
        additions,
        deletions,
    };

    set_cached_diff(cache_key, result.clone());
    Ok(result)
}
